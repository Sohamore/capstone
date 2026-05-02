import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  projectId:   { type: String, required: true, unique: true },
  title:       { type: String, required: true },        // "name" on public page
  name:        { type: String },                         // alias
  category:    { type: String, default: "Industrial" },
  client:      { type: String, default: "" },
  clientEmail: { type: String, default: "" },
  userUid:     { type: String, default: "" },
  adminNotes:  { type: String, default: "" },
  latitude:    { type: Number, default: null },
  longitude:   { type: Number, default: null },
  location:    { type: String, default: "" },
  district:    { type: String, default: "" },
  status:      { type: String, enum: ["Pending Request", "Negotiating", "Planning", "Ongoing", "In Progress", "Completed", "On Hold"], default: "Planning" },
  description: { type: String, default: "" },
  startDate:   { type: String, default: "" },           // "Jan 2024" format as shown on site
  targetDate:  { type: String, default: "" },           // "Oct 2025"
  endDate:     { type: String, default: "" },
  budget:      { type: String, default: "" },           // "₹4.2 Cr" as text
  value:       { type: Number, default: 0 },            // numeric INR for admin
  progress:    { type: Number, default: 0, min: 0, max: 100 },
  workers:     { type: Number, default: 0 },
  steelUsed:   { type: String, default: "" },           // "315 MT"
  area:        { type: String, default: "" },           // "2.4 Lakh sq ft"
  images:      [{ type: String }],                      // image URLs
  tags:        [{ type: String }],                      // ["TMT Fe500D","Structural Sections"]
  highlights:  [{ type: String }],                      // bullet points
  featured:    { type: Boolean, default: false },
  customizable: { type: Boolean, default: false },
  customizationDetails: { type: String, default: "" },
  customizationBudget: { type: String, default: "" },
  customizationImages: [{ type: String }],
  customizationFiles: [{ type: String }],
  budgetBreakdown: {
    material: { type: String, default: "" },
    workers: { type: String, default: "" },
    gst: { type: String, default: "" },
    makingCharges: { type: String, default: "" },
    other: { type: String, default: "" }
  },
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
