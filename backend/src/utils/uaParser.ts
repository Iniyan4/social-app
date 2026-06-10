export interface DeviceDetails {
    browserType: string;
    operatingSystem: string;
    deviceType: 'desktop' | 'laptop' | 'mobile';
}

export const parseUserAgentDetails = (uaString: string | undefined): DeviceDetails => {
    if (!uaString) {
        return { browserType: 'Unknown Browser', operatingSystem: 'Unknown OS', deviceType: 'desktop' };
    }

    let browserType = 'Other Browser';
    let operatingSystem = 'Unknown OS';
    let deviceType: 'desktop' | 'laptop' | 'mobile' = 'desktop';

    // 1. Detect Browser Identity
    if (uaString.includes('Edg') || uaString.includes('Trident') || uaString.includes('MSIE')) {
        browserType = 'Microsoft Browser';
    } else if (uaString.includes('Chrome') && !uaString.includes('Chromium')) {
        browserType = 'Google Chrome';
    } else if (uaString.includes('Safari') && !uaString.includes('Chrome')) {
        browserType = 'Safari';
    } else if (uaString.includes('Firefox')) {
        browserType = 'Firefox';
    }

    // 2. Detect Operating System
    if (uaString.includes('Windows')) operatingSystem = 'Windows';
    else if (uaString.includes('Macintosh') || uaString.includes('Mac OS X')) operatingSystem = 'macOS';
    else if (uaString.includes('Android')) operatingSystem = 'Android';
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) operatingSystem = 'iOS';
    else if (uaString.includes('Linux')) operatingSystem = 'Linux';

    // 3. Detect Device Form Factor
    if (/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
        deviceType = 'mobile';
    } else if (uaString.includes('Macintosh') || uaString.includes('Windows NT')) {
        // Basic heuristic sorting laptops vs standard workstations
        deviceType = 'laptop';
    }

    return { browserType, operatingSystem, deviceType };
};