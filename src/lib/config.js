// API Configuration (matches frontend)
// Set NEXT_PUBLIC_API_BASE_URL in .env.local to override
// Local: http://localhost:5001/api | Production: https://ticketlybackend-production.up.railway.app/api
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api';

