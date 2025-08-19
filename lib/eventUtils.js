// Utility functions for event management

/**
 * Determines the current status of an event based on start and end dates
 * @param {string} startDate - Event start date (ISO string)
 * @param {string} endDate - Event end date (ISO string)
 * @returns {Object} Object containing status, label, and styling information
 */
export const getEventStatus = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time to start of day for accurate date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  if (today < startDay) {
    // Event hasn't started yet
    return {
      status: 'upcoming',
      label: 'Upcoming',
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      icon: 'calendar',
      showRegistration: true,
      message: 'Registration Open'
    };
  } else if (today >= startDay && today <= endDay) {
    // Event is currently live
    return {
      status: 'live',
      label: 'LIVE',
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: 'play',
      showRegistration: false,
      message: 'Event in Progress'
    };
  } else {
    // Event has ended
    return {
      status: 'ended',
      label: 'Ended',
      color: 'gray',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-200',
      icon: 'check',
      showRegistration: false,
      message: 'Event Completed'
    };
  }
};

/**
 * Calculates available slots for an event
 * @param {number} registered - Number of registered participants
 * @param {number} maxCapacity - Maximum capacity allowed
 * @returns {Object} Object containing available slots and capacity info
 */
export const getAvailableSlots = (registered = 0, maxCapacity = null) => {
  if (maxCapacity === null || maxCapacity === undefined) {
    return {
      available: '∞',
      isUnlimited: true,
      remaining: '∞',
      percentage: 0
    };
  }
  
  const available = Math.max(0, maxCapacity - registered);
  const percentage = maxCapacity > 0 ? Math.round((registered / maxCapacity) * 100) : 0;
  
  return {
    available: available,
    isUnlimited: false,
    remaining: available,
    percentage: percentage
  };
};

/**
 * Formats date for display
 * @param {string} dateString - Date string to format
 * @param {string} format - Format type ('short', 'long', 'time')
 * @returns {string} Formatted date string
 */
export const formatEventDate = (dateString, format = 'short') => {
  const date = new Date(dateString);
  
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    case 'time':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    default:
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
  }
};
