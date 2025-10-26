import axios from 'axios'

// Use relative URL since Vite proxy will handle routing to backend
//const API_BASE_URL = '/api'

/*const API_BASE_URL =
  import.meta.env.PROD
    ? "https://tourpilgrimageportal.onrender.com"
    : "/api"; // let proxy handle i
  */

const API_BASE_URL = 'https://tourpilgrimageportal.onrender.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.warn('Backend server is not available. Please start the backend server on port 5000.')
      // You can show a user-friendly message here
      const networkError = new Error('Backend server is not available. Please contact administrator.')
      networkError.name = 'NetworkError'
      return Promise.reject(networkError)
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'member' | 'admin'
  phone?: string
  aadhar?: string
}

export interface Tour {
  _id: string
  title: string
  description: string
  shortDescription?: string
  duration: {
    days: number
    nights: number
  }
  pricing: {
    adult: number
    child: number
    senior: number
    currency: string
  }
  category: string
  difficulty: string
  featured: boolean
  destinations: Array<{
    name: string
    state: string
    significance: string
  }>
  startDate?: string
  endDate?: string
  maxParticipants?: number
  currentBookings?: number
  availableSeats?: number
  status?: 'draft' | 'published' | 'cancelled'
  images?: string[]
}

export interface Booking {
  _id: string
  userId: string
  tourId: string
  tour?: Tour
  status: 'pending' | 'confirmed' | 'cancelled' | 'interested' | 'paid'
  participants: Array<{
    name: string
    age: number
    aadhar: string
    relation: string
  }>
  totalAmount: number
  createdAt: string
  bookingId?: string
  totalParticipants?: number
  paymentStatus?: 'pending' | 'partial' | 'paid'
  bookingDate?: string
  pricing?: {
    total: number
    breakdown?: any
  }
}

export interface Expense {
  _id: string
  tour: string | Tour
  description: string
  amount: number
  category: string
  expenseDate: string
  receiptNumber?: string
  vendor?: {
    name: string
    contact?: string
    address?: string
  }
  location?: {
    name: string
    address: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'other'
  isApproved: boolean
  approvedBy?: string
  approvedAt?: string
  addedBy: string
  notes?: string
  attachments?: string[]
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

export interface FamilyMember {
  _id?: string
  name: string
  age: number
  aadhar: string
  relation: string
}

// Backend participant interface with transformed fields
export interface BackendParticipant {
  name: string
  age: number
  aadharNumber: string
  relationship: string
  priceCategory: 'adult' | 'child' | 'senior'
}

// Accommodation Types
export interface Room {
  _id?: string
  roomNumber: string
  roomType: 'single' | 'double' | 'triple' | 'family' | 'dormitory' | 'suite'
  capacity: number
  facilities: string[]
  pricePerNight: number
  isAvailable: boolean
  bookings: RoomBooking[]
}

export interface RoomBooking {
  bookingId: string
  checkIn: string
  checkOut: string
  guests: Array<{
    name: string
    age: number
    relation: string
  }>
}

export interface Accommodation {
  _id: string
  name: string
  category: 'hotel' | 'cottage' | 'guest-house' | 'marriage-hall' | 'apartment' | 'lodge'
  description?: string
  location: {
    address: string
    city: string
    state: string
    pincode: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  contact: {
    phone: string
    email?: string
    website?: string
  }
  owner: {
    name: string
    phone: string
    email?: string
  }
  facilities: string[]
  rooms: Room[]
  associatedTours: Array<{
    tour: string | Tour
    destination: string
    dayNumber: number
    checkInTime: string
    checkOutTime: string
  }>
  pricing: {
    basePrice: number
    seasonalRates: Array<{
      season: 'peak' | 'normal' | 'off-season'
      multiplier: number
      startDate?: string
      endDate?: string
    }>
    extraPersonCharge: number
  }
  policies?: {
    cancellationPolicy?: string
    checkInPolicy?: string
    childPolicy?: string
  }
  rating: {
    overall: number
    cleanliness: number
    service: number
    location: number
    reviewCount: number
  }
  images: Array<{
    url: string
    caption?: string
    isPrimary: boolean
  }>
  isActive: boolean
  isVerified: boolean
  verificationDate?: string
  verifiedBy?: string
  createdBy: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  totalRooms?: number
  availableRooms?: number
  fullAddress?: string
}

// Authentication API
export const authAPI = {
  register: (userData: { name: string; email: string; password: string; phone?: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', userData),
  
  login: (credentials: { email: string; password: string }) =>
    api.post<{ user: User; token: string }>('/auth/login', credentials),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  getAllUsers: () =>
    api.get<User[]>('/admin/users')
}

// Tours API
export const toursAPI = {
  getAll: (params?: { page?: number; limit?: number; category?: string; featured?: boolean }) =>
    api.get<{ tours: Tour[]; totalPages: number; currentPage: number; total: number }>('/tours', { params }),
  
  getById: (id: string) =>
    api.get<Tour>(`/tours/${id}`),
  
  create: (tourData: Omit<Tour, '_id'>) =>
    api.post<Tour>('/tours', tourData),
  
  update: (id: string, tourData: Partial<Tour>) =>
    api.put<Tour>(`/tours/${id}`, tourData),
  
  delete: (id: string) =>
    api.delete(`/tours/${id}`),

  // Admin functions
  getAllForAdmin: (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    region?: string; 
    featured?: boolean;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<{ tours: Tour[]; totalPages: number; currentPage: number; total: number }>('/tours/admin/all', { params }),

  updateStatus: (id: string, status: string) =>
    api.patch<Tour>(`/tours/${id}/status`, { status }),

  toggleFeatured: (id: string, featured: boolean) =>
    api.patch<Tour>(`/tours/${id}/featured`, { featured }),

  duplicate: (id: string) =>
    api.post<Tour>(`/tours/${id}/duplicate`)
}

// Bookings API
export const bookingsAPI = {
  getAll: (userId?: string) =>
    api.get<Booking[]>('/bookings', { params: { userId } }),
  
  create: (bookingData: { tourId: string; participants: BackendParticipant[] }) =>
    api.post<Booking>('/bookings', bookingData),
  
  update: (id: string, updates: Partial<Booking>) =>
    api.put<Booking>(`/bookings/${id}`, updates),
  
  cancel: (id: string) =>
    api.put<Booking>(`/bookings/${id}`, { status: 'cancelled' }),

  expressInterest: (tourId: string) =>
    api.post(`/bookings/interest`, { tourId }),

  // Admin functions
  getAllForAdmin: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    tour?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) =>
    api.get<{ bookings: Booking[]; totalPages: number; currentPage: number; total: number }>('/bookings/admin/all', { params }),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch<Booking>(`/bookings/admin/${id}/status`, { status, notes }),

  deleteBooking: (id: string) =>
    api.delete(`/bookings/admin/${id}`),

  addFamilyMember: (id: string, participants: BackendParticipant[]) =>
    api.post<Booking>(`/bookings/${id}/add-family`, { participants }),

  createForUser: (bookingData: {
    userId: string;
    tourId: string;
    participants: BackendParticipant[];
    specialRequests?: string;
    emergencyContact?: any;
    autoApprove?: boolean;
  }) =>
    api.post<Booking>('/bookings/admin/create', bookingData)
}

// Expenses API
export const expensesAPI = {
  getAll: (tourId?: string) =>
    api.get<Expense[]>('/expenses', { params: { tourId } }),
  
  create: (expenseData: Omit<Expense, '_id' | 'createdBy'>) =>
    api.post<Expense>('/expenses', expenseData),
  
  update: (id: string, updates: Partial<Expense>) =>
    api.put<Expense>(`/expenses/${id}`, updates),
  
  delete: (id: string) =>
    api.delete(`/expenses/${id}`),
  
  getReports: (params?: { startDate?: string; endDate?: string; tourId?: string }) =>
    api.get('/expenses/reports', { params }),

  // Admin functions
  adminCreate: (expenseData: Omit<Expense, '_id' | 'addedBy'>) =>
    api.post<Expense>('/expenses/admin/create', expenseData),

  adminUpdate: (id: string, updates: Partial<Expense>) =>
    api.put<Expense>(`/expenses/admin/${id}`, updates),

  adminDelete: (id: string) =>
    api.delete(`/expenses/admin/${id}`),

  adminGetAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    tour?: string;
    isApproved?: boolean;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) =>
    api.get<{ expenses: Expense[]; totalPages: number; currentPage: number; total: number }>('/expenses/admin', { params }),

  adminApprove: (id: string, isApproved: boolean, rejectionReason?: string) =>
    api.patch<Expense>(`/expenses/admin/${id}/approval`, { isApproved, rejectionReason })
}

// Family Members API (if needed separately)
export const familyAPI = {
  getMembers: () =>
    api.get<FamilyMember[]>('/family-members'),
  
  addMember: (memberData: Omit<FamilyMember, '_id'>) =>
    api.post<FamilyMember>('/family-members', memberData),
  
  updateMember: (id: string, updates: Partial<FamilyMember>) =>
    api.put<FamilyMember>(`/family-members/${id}`, updates),
  
  deleteMember: (id: string) =>
    api.delete(`/family-members/${id}`)
}

// Accommodations API
export const accommodationsAPI = {
  getAll: (params?: {
    category?: string
    city?: string
    state?: string
    tourId?: string
    destination?: string
    isActive?: boolean
    isVerified?: boolean
    minRating?: number
    minPrice?: number
    maxPrice?: number
    facilities?: string[]
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => api.get<{
    accommodations: Accommodation[]
    totalPages: number
    currentPage: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }>('/accommodations', { params }),

  getById: (id: string) =>
    api.get<Accommodation>(`/accommodations/${id}`),

  create: (accommodationData: Omit<Accommodation, '_id' | 'createdBy' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ message: string; accommodation: Accommodation }>('/accommodations', accommodationData),

  update: (id: string, updates: Partial<Accommodation>) =>
    api.put<{ message: string; accommodation: Accommodation }>(`/accommodations/${id}`, updates),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/accommodations/${id}`),

  // Room management
  addRoom: (accommodationId: string, roomData: Omit<Room, '_id' | 'bookings'>) =>
    api.post<{ message: string; room: Room }>(`/accommodations/${accommodationId}/rooms`, roomData),

  updateRoom: (accommodationId: string, roomId: string, updates: Partial<Room>) =>
    api.put<{ message: string; room: Room }>(`/accommodations/${accommodationId}/rooms/${roomId}`, updates),

  deleteRoom: (accommodationId: string, roomId: string) =>
    api.delete<{ message: string }>(`/accommodations/${accommodationId}/rooms/${roomId}`),

  // Tour associations
  addTourAssociation: (accommodationId: string, tourData: {
    tourId: string
    destination: string
    dayNumber: number
    checkInTime?: string
    checkOutTime?: string
  }) => api.post<{ message: string; accommodation: Accommodation }>(`/accommodations/${accommodationId}/tours`, tourData),

  removeTourAssociation: (accommodationId: string, tourId: string, params?: {
    destination?: string
    dayNumber?: number
  }) => api.delete<{ message: string }>(`/accommodations/${accommodationId}/tours/${tourId}`, { params }),

  // Room booking
  bookRoom: (accommodationId: string, roomId: string, bookingData: {
    bookingId: string
    checkIn: string
    checkOut: string
    guests?: Array<{ name: string; age: number; relation: string }>
  }) => api.post<{ message: string; booking: RoomBooking }>(`/accommodations/${accommodationId}/rooms/${roomId}/book`, bookingData),

  // Availability checking
  checkAvailability: (accommodationId: string, params: {
    checkIn: string
    checkOut: string
    roomType?: string
  }) => api.get<{
    accommodationId: string
    accommodationName: string
    checkIn: string
    checkOut: string
    totalRooms: number
    availableRooms: number
    rooms: Array<{
      _id: string
      roomNumber: string
      roomType: string
      capacity: number
      pricePerNight: number
      facilities: string[]
    }>
  }>(`/accommodations/${accommodationId}/availability`, { params }),

  // Get by tour (itinerary-wise)
  getByTour: (tourId: string, params?: {
    destination?: string
    dayNumber?: number
  }) => api.get<{
    tourId: string
    itinerary: Array<{
      dayNumber: number
      destination: string
      accommodations: Array<Accommodation & {
        tourAssociation: {
          dayNumber: number
          destination: string
          checkInTime: string
          checkOutTime: string
        }
      }>
    }>
  }>(`/accommodations/tour/${tourId}`, { params }),

  // Statistics
  getStats: (params?: {
    startDate?: string
    endDate?: string
    category?: string
    city?: string
  }) => api.get<{
    overview: {
      totalAccommodations: number
      totalRooms: number
      averageRating: number
      totalCapacity: number
      averagePrice: number
    }
    categories: Array<{
      _id: string
      count: number
      averageRating: number
      averagePrice: number
    }>
  }>('/accommodations/stats/overview', { params }),

  // Room booking assignments
  assignRoomToBooking: (accommodationId: string, roomId: string, data: {
    bookingId: string
    checkIn: string
    checkOut: string
    guests?: Array<{
      name: string
      age: number
      relation: string
    }>
  }) => api.post(`/accommodations/${accommodationId}/rooms/${roomId}/assign-booking`, data),

  // Get room assignments for a booking
  getBookingRoomAssignments: (bookingId: string) => api.get<{
    bookingId: string
    roomAssignments: Array<{
      accommodationId: string
      accommodationName: string
      accommodationCategory: string
      location: {
        address: string
        city: string
        state: string
        pincode: string
      }
      roomId: string
      roomNumber: string
      roomType: string
      capacity: number
      facilities: string[]
      pricePerNight: number
      checkIn: string
      checkOut: string
      guests: Array<{
        name: string
        age: number
        relation: string
      }>
    }>
    totalRooms: number
  }>(`/accommodations/bookings/${bookingId}/rooms`),

  // Get accommodations by itinerary/tour
  getByItinerary: (tourId: string, params?: {
    destination?: string
    date?: string
  }) => api.get<{
    tourId: string
    destination: string
    accommodations: Array<Accommodation & {
      rooms: Array<Room & {
        isAvailableOnDate?: boolean
      }>
    }>
    totalAccommodations: number
    totalRooms: number
  }>(`/accommodations/itinerary/${tourId}`, { params }),

  // Remove room booking assignment
  removeRoomBooking: (accommodationId: string, roomId: string, bookingId: string) => 
    api.delete(`/accommodations/${accommodationId}/rooms/${roomId}/bookings/${bookingId}`),

  // Get available rooms for specific dates
  getAvailableRooms: (accommodationId: string, params: {
    checkIn: string
    checkOut: string
    capacity?: number
  }) => api.get<{
    accommodationId: string
    accommodationName: string
    checkIn: string
    checkOut: string
    availableRooms: Room[]
    totalAvailable: number
    totalRooms: number
  }>(`/accommodations/${accommodationId}/available-rooms`, { params })
}

// Member Types (Misc)
export interface Member {
  _id: string
  section: string
  section_desc: string
  s_no: number
  mob_s_no: number
  group_s_no: number
  name_aadhar: string
  gender: 'M' | 'F'
  age?: number | null
  aadhar_no?: string | null
  createdBy?: User
  updatedBy?: User
  createdAt?: string
  updatedAt?: string
  displayInfo?: string
}

// Misc API
export const miscAPI = {
  // Get all members with filters
  getAll: (params?: {
    section?: string
    gender?: string
    minAge?: number
    maxAge?: number
    search?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => api.get<{
    members: Member[]
    pagination: {
      total: number
      page: number
      pages: number
      limit: number
    }
  }>('/misc', { params }),

  // Get single member
  getById: (id: string) => api.get<Member>(`/misc/${id}`),

  // Create new member
  create: (memberData: Omit<Member, '_id' | 'createdAt' | 'updatedAt' | 'displayInfo'>) => 
    api.post<{ message: string; member: Member }>('/misc', memberData),

  // Update member
  update: (id: string, memberData: Partial<Omit<Member, '_id' | 'createdAt' | 'updatedAt' | 'displayInfo'>>) => 
    api.put<{ message: string; member: Member }>(`/misc/${id}`, memberData),

  // Delete member
  delete: (id: string) => api.delete<{ message: string }>(`/misc/${id}`),

  // Get statistics
  getStats: () => api.get<{
    summary: {
      totalMembers: number
      maleCount: number
      femaleCount: number
      averageAge: number
    }
    sectionStats: Array<{
      _id: string
      count: number
      avgAge: number
    }>
  }>('/misc/stats/summary')
}

export default api
