import express from "express";
import Project  from "../models/Project.js";

const router = express.Router();

// GET live project stats — all computed dynamically from database
router.get("/stats", async (req, res) => {
  try {
    const all = await Project.find({});

    const total        = all.length;
    const completed    = all.filter(p => p.status === "Completed").length;
    const ongoing      = all.filter(p => p.status === "Ongoing").length;
    const planning     = all.filter(p => p.status === "Planning").length;

    // Unique categories
    const categories   = [...new Set(all.map(p => p.category).filter(Boolean))].length;

    // Unique districts (cities covered)
    const districts    = [...new Set(all.map(p => p.district).filter(Boolean))].length;

    // Total workers across all projects
    const totalWorkers = all.reduce((sum, p) => sum + (p.workers || 0), 0);

    // Average progress across ongoing projects
    const ongoing_list = all.filter(p => p.status === "Ongoing");
    const avgProgress  = ongoing_list.length
      ? Math.round(ongoing_list.reduce((s, p) => s + (p.progress || 0), 0) / ongoing_list.length)
      : 0;

    // Total contract value (sum of numeric `value` field in INR)
    const totalValue   = all.reduce((sum, p) => sum + (p.value || 0), 0);

    // On-time delivery: % of completed projects where actualEndDate <= plannedEndDate
    const withDates    = all.filter(p => p.status === "Completed" && p.endDate && p.targetDate);
    const onTime       = withDates.filter(p => new Date(p.endDate) <= new Date(p.targetDate)).length;
    const onTimePercent = withDates.length > 0
      ? Math.round((onTime / withDates.length) * 100)
      : 100; // default 100% if no data to compare

    // Average client rating
    const ratings       = all.map(p => parseFloat(p.clientRating)).filter(r => !isNaN(r));
    const avgRating     = ratings.length
      ? (ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1)
      : "4.9";

    // Years of experience — since company founded (1995 assumed, adjust as needed)
    const FOUNDED_YEAR  = 2004;
    const yearsExp      = new Date().getFullYear() - FOUNDED_YEAR;

    res.json({
      totalProjects:      total,
      completedProjects:  completed,
      ongoingProjects:    ongoing,
      planningProjects:   planning,
      totalCategories:    categories,
      totalDistricts:     districts,
      totalWorkers,
      avgProgress,
      totalValueINR:      totalValue,
      onTimePercentage:   onTimePercent,
      avgRating,
      yearsExperience:    yearsExp,
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET all projects
router.get("/", async (req, res) => {
  try {
    const { status, featured } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (featured) filter.featured = featured === "true";
    const projects = await Project.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single
router.get("/:id", async (req, res) => {
  try {
    let p;
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      p = await Project.findById(req.params.id);
    }
    if (!p) {
      p = await Project.findOne({ projectId: req.params.id });
    }
    if (!p) return res.status(404).json({ message: "Not found" });
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET projects by user email or uid
router.get("/user/:emailOrUid", async (req, res) => {
  try {
    const term = req.params.emailOrUid;
    const filter = {
      $or: [
        { clientEmail: term },
        { userUid: term }
      ]
    };
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create
router.post("/", async (req, res) => {
  try {
    const payload = { ...req.body };
    
    // Auto-link to existing user if clientEmail is provided
    if (payload.clientEmail && !payload.userUid) {
      const { default: User } = await import("../models/User.js");
      const user = await User.findOne({ email: payload.clientEmail });
      if (user) {
        payload.userUid = user.firebaseUid;
      }
    }

    const count     = await Project.countDocuments();
    const projectId = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
    const project   = await Project.create({ projectId, ...payload });
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const oldProject = await Project.findById(req.params.id);
    if (!oldProject) return res.status(404).json({ message: "Not found" });

    const project = await Project.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    
    // Check if status changed or admin notes were added/changed
    const statusChanged = oldProject.status !== project.status;
    const notesChanged = project.adminNotes && oldProject.adminNotes !== project.adminNotes;
    
    if ((statusChanged || notesChanged) && project.userUid) {
      import("../models/User.js").then(async ({ default: User }) => {
        const user = await User.findOne({ firebaseUid: project.userUid });
        if (user && user.email) {
          import("../utils/emailService.js").then(({ sendProjectUpdateEmail }) => {
            // Only send notes if they actually changed, to avoid repeating them if only status changed
            const notesToSend = notesChanged ? project.adminNotes : null;
            sendProjectUpdateEmail(user.email, project, project.status, notesToSend);
          }).catch(err => console.error("Failed to load emailService", err));
        }
      });
    }

    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Project deleted", id: project._id });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
