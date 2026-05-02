// frontend/src/services/api.ts
// This file handles all calls to your Express + MongoDB backend

// In production (Vercel), API_ORIGIN is empty so requests go to /api/... on the same domain.
// In development, falls back to localhost:5000.
export const API_ORIGIN = import.meta.env.VITE_API_URL ?? "";
const BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : "/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MongoUser {
  _id:         string;
  firebaseUid: string;
  name:        string;
  email:       string;
  role:        "user" | "admin";
  company:     string;
  phone:       string;
  photoURL:    string;
  address: {
    street:  string;
    city:    string;
    state:   string;
    pincode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MongoOrder {
  _id:         string;
  orderId:     string;
  firebaseUid: string;
  product:     string;
  quantity:    string;
  amount:      string;
  status:      "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt:   string;
  isCustomized?: boolean;
  customDetails?: Record<string, string>;
  notes?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── User API ──────────────────────────────────────────────────────────────────

// Fetch user profile from MongoDB
export const getUser = (firebaseUid: string) =>
  request<MongoUser>(`/users/${firebaseUid}`);

// Fetch all users (Admin only)
export const getAllUsers = () => request<MongoUser[]>("/users");

/** Same as getUser but returns null if the user document does not exist (404). */
export async function getUserOrNull(firebaseUid: string): Promise<MongoUser | null> {
  try {
    return await getUser(firebaseUid);
  } catch {
    return null;
  }
}

// Create or update user in MongoDB (call this after every Firebase login)
export const syncUser = (data: {
  firebaseUid: string;
  name:        string;
  email:       string;
  role?:       string;
  company?:    string;
  phone?:      string;
  photoURL?:   string;
}) => request<MongoUser>("/users", { method: "POST", body: JSON.stringify(data) });

// Update user profile fields
export const updateUser = (firebaseUid: string, updates: Partial<MongoUser>) =>
  request<MongoUser>(`/users/${firebaseUid}`, {
    method: "PUT",
    body:   JSON.stringify(updates),
  });

// ── Orders API ────────────────────────────────────────────────────────────────

// Get all orders for a user
export const getUserOrders = (firebaseUid: string) =>
  request<MongoOrder[]>(`/orders/${firebaseUid}`);

// Get all orders (Admin only)
export const getAllOrders = () => request<MongoOrder[]>("/orders");

// Create a new order (Admin)
export const createOrder = (data: {
  firebaseUid: string;
  product: string;
  quantity: string;
  amount: string;
  status?: string;
}) => request<MongoOrder>("/orders", { method: "POST", body: JSON.stringify(data) });

// Update order status
export const updateOrderStatus = (orderId: string, status: string) =>
  request<MongoOrder>(`/orders/${orderId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });

// Delete an order by MongoDB _id
export const deleteOrder = (id: string) =>
  request<{ message: string }>(`/orders/${id}`, { method: "DELETE" });

// ── User Admin API ────────────────────────────────────────────────────────────

// Update user role (admin only)
export const updateUserRole = (firebaseUid: string, role: "user" | "admin") =>
  request<MongoUser>(`/users/${firebaseUid}`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });

// Delete a user (admin only)
export const deleteUser = (firebaseUid: string) =>
  request<{ message: string }>(`/users/${firebaseUid}`, { method: "DELETE" });

// ── Products Admin API ────────────────────────────────────────────────────────

export interface MongoProduct {
  _id: string;
  productId: string;
  productName: string;
  category: string;
  basePriceINR?: number;
  finalPriceINR?: number;
  stockQuantity?: number;
  availability?: string;
  imageUrl?: string;
  steelGrade?: string;
  rating?: number;
  reviewsCount?: number;
  salesCount?: number;
  [key: string]: unknown;
}

// Get all products (paginated)
export const getProducts = (page = 1, limit = 50) =>
  request<{ products: MongoProduct[]; total: number }>(`/products?page=${page}&limit=${limit}`);

// Create a product
export const createProduct = (data: Partial<MongoProduct>) =>
  request<MongoProduct>("/products", { method: "POST", body: JSON.stringify(data) });

// Update a product
export const updateProduct = (id: string, data: Partial<MongoProduct>) =>
  request<MongoProduct>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) });

// Delete a product
export const deleteProduct = (id: string) =>
  request<{ message: string }>(`/products/${id}`, { method: "DELETE" });

// ── Inquiries API ─────────────────────────────────────────────────────────────

export interface MongoInquiry {
  _id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  enquiryType?: string;
  projectType?: string;
  steelGrade?: string;
  quantity?: string;
  message?: string;
  timeline?: string;
  customDimensions?: string;
  customFinish?: string;
  customMaterial?: string;
  customNotes?: string;
  customizationFiles?: string[];
  firebaseUid?: string;
  status: "Pending" | "Reviewed" | "Approved" | "Responded" | "Rejected";
  adminNotes?: string;
  adminResponse?: string;
  referenceName?: string;
  referenceCategory?: string;
  productId?: string;
  projectId?: string;
  productDetails?: MongoProduct;
  projectDetails?: any;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

// Get all inquiries (Admin only)
export const getAllInquiries = () => request<MongoInquiry[]>("/inquiries");

// Get inquiries for a specific user
export const getUserInquiries = (firebaseUid: string) =>
  request<MongoInquiry[]>(`/inquiries/user/${firebaseUid}`);

// Create a new inquiry
export const createInquiry = (data: Partial<MongoInquiry>) =>
  request<MongoInquiry>("/inquiries", { method: "POST", body: JSON.stringify(data) });

// Update inquiry status/response (Admin)
export const updateInquiry = (id: string, updates: Partial<MongoInquiry>) =>
  request<MongoInquiry>(`/inquiries/${id}`, { method: "PUT", body: JSON.stringify(updates) });

// ── Projects API ──────────────────────────────────────────────────────────────

export interface MongoProject {
  _id: string;
  projectId: string;
  title: string;
  name?: string;
  category: string;
  client: string;
  clientEmail?: string;
  userUid?: string;
  adminNotes?: string;
  location: string;
  district: string;
  latitude?: number;
  longitude?: number;
  status: "Pending Request" | "Negotiating" | "Planning" | "Ongoing" | "In Progress" | "Completed" | "On Hold";
  description?: string;
  startDate?: string;
  targetDate?: string;
  endDate?: string;
  budget?: string;
  value?: number;
  progress: number;
  workers?: number;
  steelUsed?: string;
  area?: string;
  images?: string[];
  tags?: string[];
  highlights?: string[];
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getAllProjects = () => request<MongoProject[]>("/projects");
export const createProject = (data: Partial<MongoProject>) => request<MongoProject>("/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id: string, updates: Partial<MongoProject>) => request<MongoProject>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(updates) });
export const deleteProject = (id: string) => request<{ message: string }>(`/projects/${id}`, { method: "DELETE" });
export const getUserProjectsByEmail = (emailOrUid: string) => request<MongoProject[]>(`/projects/user/${encodeURIComponent(emailOrUid)}`);
