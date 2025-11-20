// Member Contact Type Definitions for Pilgrimage Portal

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  maritalStatus: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  bloodGroup?: string;
  occupation?: string;
  education?: string;
}

export interface AddressInfo {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface ContactInfo {
  primaryPhone: string;
  alternatePhone?: string;
  email: string;
  whatsappNumber?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface SpiritualInfo {
  gothra: string;
  nakshatra: string;
  rashi?: string;
  acharyanName?: string;
  guruName?: string;
  initiationDate?: string;
  spiritualLineage?: string;
}

export interface TemplePreferences {
  preferredDeity: string[];
  preferredUtsavams: string[];
  visitFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Occasionally';
  preferredTemples: string[];
  volunteerInterest: boolean;
  donationPreference?: 'Anna Dhanam' | 'Temple Maintenance' | 'Festivals' | 'General';
}

export interface ReligiousActivities {
  dailyPuja: boolean;
  vedicChanting: boolean;
  bhajansInterest: boolean;
  scriptureStudy: boolean;
  meditationPractice: boolean;
  yogaPractice: boolean;
  participatesInSatsang: boolean;
  languagesKnown: string[];
}

export interface PilgrimageHistory {
  templeVisited: string;
  location: string;
  visitDate: string;
  tourPackage?: string;
  notes?: string;
}

export interface MemberContact {
  _id?: string;
  memberId: string; // Unique member identifier
  personalInfo: PersonalInfo;
  addressInfo: AddressInfo;
  contactInfo: ContactInfo;
  spiritualInfo: SpiritualInfo;
  templePreferences: TemplePreferences;
  religiousActivities: ReligiousActivities;
  pilgrimageHistory?: PilgrimageHistory[];
  dietaryRestrictions?: string[];
  specialNeeds?: string;
  membershipType: 'Regular' | 'Premium' | 'Lifetime' | 'Family';
  membershipStartDate: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemberContactFormData extends Omit<MemberContact, '_id' | 'createdAt' | 'updatedAt'> {}

// Common deity names for dropdown
export const DEITY_OPTIONS = [
  'Lord Vishnu',
  'Lord Shiva',
  'Lord Ganesha',
  'Lord Murugan',
  'Lord Hanuman',
  'Goddess Lakshmi',
  'Goddess Saraswati',
  'Goddess Durga',
  'Goddess Parvati',
  'Lord Krishna',
  'Lord Rama',
  'Lord Venkateswara',
  'Lord Ayyappa',
  'Goddess Meenakshi'
];

// Common utsavam names
export const UTSAVAM_OPTIONS = [
  'Brahmotsavam',
  'Vaikunta Ekadasi',
  'Maha Shivaratri',
  'Navaratri',
  'Panguni Uthiram',
  'Aadi Pooram',
  'Skanda Shasti',
  'Karthigai Deepam',
  'Thai Poosam',
  'Vasantha Utsavam',
  'Chitra Pournami',
  'Masi Magam'
];

// Common gothra names
export const GOTHRA_OPTIONS = [
  'Bharadvaja',
  'Kashyapa',
  'Vashishta',
  'Gautama',
  'Atri',
  'Vishwamitra',
  'Jamadagni',
  'Agastya',
  'Angirasa',
  'Bhrigu',
  'Kaundinya',
  'Sandilya',
  'Harita',
  'Kaushika'
];

// Common nakshatra names
export const NAKSHATRA_OPTIONS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati'
];

// Common rashi names
export const RASHI_OPTIONS = [
  'Mesha (Aries)',
  'Vrishabha (Taurus)',
  'Mithuna (Gemini)',
  'Karka (Cancer)',
  'Simha (Leo)',
  'Kanya (Virgo)',
  'Tula (Libra)',
  'Vrishchika (Scorpio)',
  'Dhanu (Sagittarius)',
  'Makara (Capricorn)',
  'Kumbha (Aquarius)',
  'Meena (Pisces)'
];

// Indian states
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Puducherry'
];
