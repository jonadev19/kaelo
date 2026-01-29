import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage keys for user preferences
 */
const STORAGE_KEYS = {
    LOCATION_ENABLED: '@kaelo:location_enabled',
} as const;

/**
 * Gets the location sharing preference
 * @returns Promise resolving to boolean (default: true)
 */
export async function getLocationEnabled(): Promise<boolean> {
    try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_ENABLED);
        return value !== null ? JSON.parse(value) : true;
    } catch (error) {
        console.error('Error reading location preference:', error);
        return true;
    }
}

/**
 * Sets the location sharing preference
 * @param enabled - Whether location sharing is enabled
 */
export async function setLocationEnabled(enabled: boolean): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENABLED, JSON.stringify(enabled));
    } catch (error) {
        console.error('Error saving location preference:', error);
    }
}
