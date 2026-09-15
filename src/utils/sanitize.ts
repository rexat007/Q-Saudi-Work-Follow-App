/**
 * Safely removes undefined properties recursively from an object
 * while keeping special Firestore types (like FieldValue/Timestamp) intact.
 */
export function sanitizeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeUndefined(item)) as any;
  }
  
  if (typeof obj === 'object') {
    // If the object is a Firestore FieldValue, Timestamp, or other custom class, preserve it as-is
    if (obj.constructor && obj.constructor.name !== 'Object' && obj.constructor.name !== 'Array') {
      return obj;
    }
    
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        result[key] = sanitizeUndefined(val);
      }
    }
    return result;
  }
  
  return obj;
}
