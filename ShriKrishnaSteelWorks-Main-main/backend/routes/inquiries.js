import express from "express";
import Inquiry from "../models/Inquiry.js";
import Product from "../models/Product.js";
import Project from "../models/Project.js";

const router = express.Router();

// Get all inquiries (for Admin)
router.get("/", async (req, res) => {
  try {
    const data = await Inquiry.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user specific inquiries
router.get("/user/:firebaseUid", async (req, res) => {
  try {
    const data = await Inquiry.find({ firebaseUid: req.params.firebaseUid }).lean().sort({ createdAt: -1 });
    
    // For each enquiry, fetch related data
    for (let enquiry of data) {
      const fallbackName = enquiry.referenceName || (enquiry.message && enquiry.message.match(/"([^"]+)"/)?.[1]);

      let p = null;
      let proj = null;

      // 1. Try explicit IDs
      if (enquiry.productId) {
        if (enquiry.productId.match(/^[0-9a-fA-F]{24}$/)) p = await Product.findById(enquiry.productId).lean();
        if (!p) p = await Product.findOne({ productId: enquiry.productId }).lean();
      } else if (enquiry.projectId) {
        if (enquiry.projectId.match(/^[0-9a-fA-F]{24}$/)) proj = await Project.findById(enquiry.projectId).lean();
        if (!proj) proj = await Project.findOne({ projectId: enquiry.projectId }).lean();
      }

      // 2. Fallback to Name match if no IDs provided
      if (!p && !proj && fallbackName) {
        // Assume product first natively, unless specifically labeled 'project'
        if (enquiry.type !== "project" && enquiry.enquiryType !== "project") {
          p = await Product.findOne({ productName: fallbackName }).lean();
        }
        if (!p) {
          proj = await Project.findOne({ name: fallbackName }).lean();
        }
      }

      if (p) enquiry.productDetails = p;
      if (proj) enquiry.projectDetails = proj;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a new inquiry
router.post("/", async (req, res) => {
  try {
    const newInquiry = new Inquiry(req.body);
    const saved = await newInquiry.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an inquiry (Admin responding)
router.put("/:id", async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ error: "Not found" });

    const wasPending = inquiry.status === "Pending";
    const oldResponse = inquiry.adminResponse;

    const updated = await Inquiry.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Check if we need to send an email
    if (updated.email && updated.adminResponse && (updated.adminResponse !== oldResponse || (wasPending && updated.status === "Responded"))) {
      import("../utils/emailService.js").then(({ sendInquiryResponseEmail }) => {
        sendInquiryResponseEmail(updated.email, updated, updated.adminResponse);
      }).catch(err => console.error("Failed to load emailService", err));
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
