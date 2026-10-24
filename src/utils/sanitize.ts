/**
 * Safely removes undefined properties recursively from an object
 * while keeping special Firestore types (like FieldValue/Timestamp) intact.
 */
export function sanitizeUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    // Dropping array elements would shift meaning; undefined slots are not persistable.
    return Array.from(obj, item => {
      if (item === undefined) throw new Error('PERSISTENCE_BOUNDARY_INVALID:undefined_array_element');
      return sanitizeUndefined(item);
    }) as any;
  }
  
  if (typeof obj === 'object') {
    // If the object is a Firestore FieldValue, Timestamp, or other custom class, preserve it as-is
    const prototype = Object.getPrototypeOf(obj);
    if (prototype && prototype.constructor?.name !== 'Object') {
      return obj;
    }
    
    const result: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        Object.defineProperty(result, key, { value: sanitizeUndefined(val), enumerable: true, writable: true, configurable: true });
      }
    }
    return result;
  }
  
  return obj;
}
