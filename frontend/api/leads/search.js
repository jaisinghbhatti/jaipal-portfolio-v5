const axios = require('axios');

// Google Places API helper
async function geocodeLocation(location, apiKey) {
  const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
    params: { address: location, key: apiKey }
  });
  
  if (response.data.status === 'OK' && response.data.results.length > 0) {
    const loc = response.data.results[0].geometry.location;
    return { latitude: loc.lat, longitude: loc.lng };
  }
  return null;
}

async function searchNearby(latitude, longitude, keyword, radius, apiKey) {
  const response = await axios.post(
    'https://places.googleapis.com/v1/places:searchText',
    {
      textQuery: keyword,
      locationBias: {
        circle: {
          center: { latitude, longitude },
          radius: parseFloat(radius)
        }
      },
      maxResultCount: 20
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.types,places.location,places.businessStatus'
      }
    }
  );
  return response.data.places || [];
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 100) / 100;
}

// Clean phone number - remove leading 0, spaces, and non-digits
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters (spaces, dashes, etc.)
  let cleaned = phone.replace(/\D/g, '');
  // Remove leading 0 if present (for Indian numbers like 099114...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  // If it starts with 91 and has extra 0 after country code, remove it
  if (cleaned.startsWith('910') && cleaned.length > 12) {
    cleaned = '91' + cleaned.substring(3);
  }
  return cleaned;
}

function generateWhatsAppLink(phone, message) {
  let cleanPhone = cleanPhoneNumber(phone);
  // Add country code if not present (10 digit Indian number)
  if (cleanPhone.length === 10 && !cleanPhone.startsWith('91')) {
    cleanPhone = '91' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      user_business_name,
      user_location,
      user_core_offering,
      target_industry,
      search_radius_km = 10
    } = req.body;

    if (!user_business_name || !user_location || !target_industry) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Google Places API key not configured' });
    }

    // Geocode location
    const coordinates = await geocodeLocation(user_location, apiKey);
    if (!coordinates) {
      return res.status(400).json({ 
        detail: `Could not find location: ${user_location}. Please provide a valid address or city.` 
      });
    }

    // Search for businesses
    const radiusMeters = search_radius_km * 1000;
    const places = await searchNearby(
      coordinates.latitude,
      coordinates.longitude,
      target_industry,
      radiusMeters,
      apiKey
    );

    if (places.length === 0) {
      return res.status(200).json({
        success: true,
        total_results: 0,
        user_location,
        user_coordinates: coordinates,
        search_radius_km,
        leads: [],
        message: `No ${target_industry} businesses found within ${search_radius_km}km of ${user_location}.`
      });
    }

    // Process leads and FILTER by radius
    const leads = places.map(place => {
      const placeLat = place.location?.latitude || 0;
      const placeLng = place.location?.longitude || 0;
      const distance = calculateDistance(coordinates.latitude, coordinates.longitude, placeLat, placeLng);
      const rawPhone = place.nationalPhoneNumber || place.internationalPhoneNumber || '';
      const phone = cleanPhoneNumber(rawPhone);
      const types = place.types || [];
      const industry = types[0]?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Business';
      const name = place.displayName?.text || 'Unknown Business';
      
      const powerPitch = `Hi ${name} team, Greetings From ${user_business_name}. We are veterans specializing in ${user_core_offering}. We offer premium service with world-class products that fit your needs. Let us know if we can get in touch for further discussion? Thanks`;
      
      return {
        name,
        address: place.formattedAddress || '',
        phone,
        distance_km: distance,
        industry,
        status: place.businessStatus || 'OPERATIONAL',
        power_pitch: powerPitch,
        whatsapp_link: phone ? generateWhatsAppLink(rawPhone, powerPitch) : ''
      };
    })
    // STRICT FILTER: Only include leads within the specified radius
    .filter(lead => lead.distance_km <= search_radius_km);

    // Sort by distance
    leads.sort((a, b) => a.distance_km - b.distance_km);

    return res.status(200).json({
      success: true,
      total_results: leads.length,
      user_location,
      user_coordinates: coordinates,
      search_radius_km,
      leads,
      message: leads.length > 0 
        ? `Found ${leads.length} potential leads in ${target_industry} within ${search_radius_km}km of ${user_location}.`
        : `No ${target_industry} businesses found within ${search_radius_km}km. Try increasing the radius.`
    });

  } catch (error) {
    console.error('Lead search error:', error);
    return res.status(500).json({ 
      error: 'Error searching for leads',
      detail: error.message 
    });
  }
}
