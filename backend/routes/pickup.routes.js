const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Pickup = require('../models/Pickup');
const User = require('../models/User');

// ✅ Import Notification Helpers
const { 
  notifyPickupScheduled, 
  notifyPickupCompleted, 
  notifyPickupCancelled 
} = require('../utils/notificationHelper');

// ✅ NEW: Helper function to assign pickup to an available agent
const assignToAgent = async () => {
  try {
    // Find all pickup agents
    const agents = await User.find({ 
      userType: 'pickup_agent',
      isVerified: true 
    });

    if (agents.length === 0) {
      console.log('No pickup agents available');
      return null;
    }

    // Simple assignment: Random agent (you can improve this with smart logic)
    const randomIndex = Math.floor(Math.random() * agents.length);
    return agents[randomIndex]._id;

    // 🔮 Future Enhancement Ideas:
    // - Assign based on agent's current workload
    // - Assign based on proximity to pickup location
    // - Assign based on agent's availability/status
    // - Round-robin assignment for fairness
  } catch (error) {
    console.error('Error assigning to agent:', error);
    return null;
  }
};

// @desc    Schedule a new pickup
// @route   POST /api/pickup/schedule
// @access  Private (Citizen only)
router.post('/schedule', protect, async (req, res) => {
  try {
    const {
      wasteType,
      pickupDate,
      timeSlot,
      address,
      estimatedWeight,
      contactPhone,
      specialInstructions
    } = req.body;

    // Validation
    if (!wasteType || !pickupDate || !timeSlot || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if pickup date is in the future
    const selectedDate = new Date(pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date must be in the future'
      });
    }

    // ✅ NEW: Auto-assign to a pickup agent
    const assignedAgentId = await assignToAgent();

    // Create pickup
    const pickup = await Pickup.create({
      user: req.user._id,
      wasteType,
      pickupDate: selectedDate,
      timeSlot,
      address,
      estimatedWeight: estimatedWeight || 0,
      contactPhone: contactPhone || req.user.phone,
      specialInstructions: specialInstructions || '',
      assignedCollector: assignedAgentId, // ✅ FIXED: Assign agent here
      status: assignedAgentId ? 'confirmed' : 'scheduled' // ✅ Status based on assignment
    });

    // ✅ Create Notification for scheduling
    try {
      await notifyPickupScheduled(req.user._id, pickup);
    } catch (error) {
      console.error('Notification error:', error);
    }

    // Calculate and award points
    const points = pickup.calculatePoints();
    
    // Update user points (partial reward for scheduling)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { points: Math.floor(points / 2) } // Half points on scheduling
    });

    res.status(201).json({
      success: true,
      message: assignedAgentId 
        ? 'Pickup scheduled and assigned to agent successfully' 
        : 'Pickup scheduled successfully (pending agent assignment)',
      data: {
        _id: pickup._id,
        wasteType: pickup.wasteType,
        pickupDate: pickup.pickupDate,
        timeSlot: pickup.timeSlot,
        verificationCode: pickup.verificationCode,
        status: pickup.status,
        assignedCollector: pickup.assignedCollector,
        pointsAwarded: Math.floor(points / 2)
      }
    });

  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling pickup',
      error: error.message
    });
  }
});

// @desc    Get all pickups for current user
// @route   GET /api/pickup/my-pickups
// @access  Private (Citizen + Agent)
router.get('/my-pickups', protect, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    // ✅ IMPROVED: Different query based on userType
    let query;
    
    if (req.user.userType === 'pickup_agent') {
      // For agents: Get pickups assigned to them
      query = { assignedCollector: req.user._id };
    } else {
      // For citizens: Get their own pickups
      query = { user: req.user._id };
    }

    // Filter by status if provided
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const pickups = await Pickup.find(query)
      .sort({ pickupDate: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('assignedCollector', 'name phone')
      .populate('user', 'name email phone address');

    const total = await Pickup.countDocuments(query);

    res.status(200).json({
      success: true,
      count: pickups.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: pickups
    });

  } catch (error) {
    console.error('Get pickups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pickups',
      error: error.message
    });
  }
});

// @desc    Get single pickup details
// @route   GET /api/pickup/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('assignedCollector', 'name phone');

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // ✅ IMPROVED: Authorization check for both citizen and agent
    const isOwner = pickup.user._id.toString() === req.user._id.toString();
    const isAssignedAgent = pickup.assignedCollector && 
                           pickup.assignedCollector._id.toString() === req.user._id.toString();
    const isAdmin = req.user.userType === 'admin';

    if (!isOwner && !isAssignedAgent && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this pickup'
      });
    }

    res.status(200).json({
      success: true,
      data: pickup
    });

  } catch (error) {
    console.error('Get pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pickup details',
      error: error.message
    });
  }
});

// @desc    Cancel a pickup
// @route   PUT /api/pickup/:id/cancel
// @access  Private (Citizen)
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Check if user owns this pickup
    if (pickup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this pickup'
      });
    }

    // Check if pickup can be cancelled
    if (pickup.status === 'completed' || pickup.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this pickup'
      });
    }

    // Update pickup status
    pickup.status = 'cancelled';
    pickup.cancellationReason = cancellationReason || 'Cancelled by user';
    pickup.cancelledBy = 'user';
    pickup.cancelledAt = new Date();

    await pickup.save();

    // ✅ Create Notification for cancellation
    try {
      await notifyPickupCancelled(pickup.user, pickup, cancellationReason);
    } catch (error) {
      console.error('Notification error:', error);
    }

    // Deduct points if they were awarded
    if (pickup.pointsAwarded > 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { points: -pickup.pointsAwarded }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pickup cancelled successfully',
      data: pickup
    });

  } catch (error) {
    console.error('Cancel pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling pickup',
      error: error.message
    });
  }
});

// @desc    Rate a completed pickup
// @route   PUT /api/pickup/:id/rate
// @access  Private (Citizen)
router.put('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating (1-5)'
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Check ownership
    if (pickup.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Check if pickup is completed
    if (pickup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed pickups'
      });
    }

    pickup.rating = rating;
    pickup.feedback = feedback || '';
    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      data: pickup
    });

  } catch (error) {
    console.error('Rate pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting rating',
      error: error.message
    });
  }
});

// ✅ @desc    Start a pickup (Agent marks as in-progress)
// ✅ @route   PUT /api/pickup/:id/start
// ✅ @access  Private (Pickup Agent only)
router.put('/:id/start', protect, async (req, res) => {
  try {
    // Check if user is pickup agent
    if (req.user.userType !== 'pickup_agent') {
      return res.status(403).json({
        success: false,
        message: 'Only pickup agents can start pickups'
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Check if pickup is assigned to this agent
    if (!pickup.assignedCollector || pickup.assignedCollector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This pickup is not assigned to you'
      });
    }

    // Check if pickup can be started
    if (pickup.status === 'completed' || pickup.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start this pickup'
      });
    }

    // Update status to in-progress
    pickup.status = 'in-progress';
    await pickup.save();

    res.status(200).json({
      success: true,
      message: 'Pickup started successfully',
      data: pickup
    });

  } catch (error) {
    console.error('Start pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting pickup',
      error: error.message
    });
  }
});

// ✅ @desc    Complete a pickup (Agent marks as completed with photo, weight, verification)
// ✅ @route   PUT /api/pickup/:id/complete
// ✅ @access  Private (Pickup Agent only)
router.put('/:id/complete', protect, async (req, res) => {
  try {
    const { verificationCode, actualWeight, completionPhoto, notes } = req.body;

    // Check if user is pickup agent
    if (req.user.userType !== 'pickup_agent') {
      return res.status(403).json({
        success: false,
        message: 'Only pickup agents can complete pickups'
      });
    }

    const pickup = await Pickup.findById(req.params.id);

    if (!pickup) {
      return res.status(404).json({
        success: false,
        message: 'Pickup not found'
      });
    }

    // Check if pickup is assigned to this agent
    if (!pickup.assignedCollector || pickup.assignedCollector.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This pickup is not assigned to you'
      });
    }

    // Verify the verification code
    if (pickup.verificationCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Validation
    if (!actualWeight || actualWeight <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide actual weight'
      });
    }

    if (!completionPhoto) {
      return res.status(400).json({
        success: false,
        message: 'Please upload completion photo'
      });
    }

    // Update pickup with completion details
    pickup.status = 'completed';
    pickup.actualWeight = actualWeight;
    pickup.completionPhoto = completionPhoto;
    pickup.actualPickupTime = new Date();
    if (notes) pickup.specialInstructions = notes;

    // Calculate final points based on actual weight
    const points = pickup.calculatePoints();
    pickup.pointsAwarded = points;
    
    await pickup.save();

    // ✅ Create Notification for completion
    try {
      await notifyPickupCompleted(pickup.user, pickup, points);
    } catch (error) {
      console.error('Notification error:', error);
    }

    // Reward remaining points to citizen
    await User.findByIdAndUpdate(pickup.user, { 
      $inc: { points: Math.floor(points / 2) } // Remaining half points
    });

    res.status(200).json({
      success: true,
      message: 'Pickup completed successfully',
      data: pickup
    });

  } catch (error) {
    console.error('Complete pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing pickup',
      error: error.message
    });
  }
});

module.exports = router;