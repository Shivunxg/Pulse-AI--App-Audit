import AdmZip from 'adm-zip';
import type {
  AndroidFindings, AndroidSecurityFindings, AndroidConfigFindings,
  AndroidPrivacyFindings, AndroidCodeQualityFindings, AndroidPerfFindings, Finding,
} from '@/types';

function createFinding(
  category: string,
  severity: 'critical' | 'warning' | 'info' | 'passed',
  title: string,
  description: string,
  recommendation?: string,
): Finding {
  return { category, severity, title, description, recommendation };
}

// Known dangerous Android permissions
const DANGEROUS_PERMISSIONS = new Set([
  'android.permission.READ_CONTACTS',
  'android.permission.WRITE_CONTACTS',
  'android.permission.GET_ACCOUNTS',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.READ_PHONE_STATE',
  'android.permission.CALL_PHONE',
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.BODY_SENSORS',
  'android.permission.READ_CALENDAR',
  'android.permission.WRITE_CALENDAR',
]);

// Known tracker/analytics SDK package prefixes
const ANALYTICS_SDKS = [
  'com.google.android.gms.analytics',
  'com.google.firebase.analytics',
  'com.flurry',
  'com.mixpanel',
  'com.amplitude',
  'com.segment',
  'com.appsflyer',
  'com.adjust',
  'com.kochava',
  'com.branch',
  'com.uxcam',
  'com.hotjar',
  'com.clevertap',
];

const AD_SDKS = [
  'com.google.android.gms.ads',
  'com.google.ads',
  'com.facebook.ads',
  'com.inmobi',
  'com.mopub',
  'com.applovin',
  'com.unity3d.ads',
  'com.ironsource',
  'com.vungle',
  'com.chartboost',
  'com.adcolony',
  'com.tapjoy',
];

const SOCIAL_SDKS = [
  'com.facebook',
  'com.twitter',
  'com.google.android.gms.auth',
  'com.google.android.gms.plus',
];

// Known hardcoded secret patterns
const SECRET_PATTERNS = [
  { pattern: /api[_-]?key\s*=\s*["'][^"']{8,}["']/gi, label: 'API Key' },
  { pattern: /secret[_-]?key\s*=\s*["'][^"']{8,}["']/gi, label: 'Secret Key' },
  { pattern: /password\s*=\s*["'][^"']{6,}["']/gi, label: 'Password' },
  { pattern: /auth[_-]?token\s*=\s*["'][^"']{8,}["']/gi, label: 'Auth Token' },
  { pattern: /firebase[_-]?api[_-]?key\s*=\s*["'][^"']{8,}["']/gi, label: 'Firebase API Key' },
  { pattern: /AIza[0-9A-Za-z_-]{35}/g, label: 'Google API Key' },
  { pattern: /AKIA[0-9A-Z]{16}/g, label: 'AWS Access Key' },
];

function extractTextFromBinary(buffer: Buffer): string {
  // Extract printable ASCII strings (length >= 6) from binary
  const strings: string[] = [];
  let current = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    if (byte >= 32 && byte <= 126) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= 6) strings.push(current);
      current = '';
    }
  }
  if (current.length >= 6) strings.push(current);
  return strings.join('\n');
}

function parseManifestXml(xmlContent: string): Record<string, any> {
  const result: Record<string, any> = {
    permissions: [],
    usesFeatures: [],
    activities: [],
    services: [],
    receivers: [],
    providers: [],
    applicationAttrs: {},
  };

  // Extract permissions
  const permRegex = /<uses-permission\s+android:name="([^"]+)"/gi;
  let match;
  while ((match = permRegex.exec(xmlContent)) !== null) {
    result.permissions.push(match[1]);
  }

  // Extract uses-feature
  const featureRegex = /<uses-feature\s+android:name="([^"]+)"/gi;
  while ((match = featureRegex.exec(xmlContent)) !== null) {
    result.usesFeatures.push(match[1]);
  }

  // Extract application attributes
  const appMatch = xmlContent.match(/<application[^>]*>/i);
  if (appMatch) {
    const appTag = appMatch[0];
    const debugMatch = appTag.match(/android:debuggable\s*=\s*["'](true|false)["']/i);
    result.applicationAttrs.debuggable = debugMatch?.[1] === 'true';
    const backupMatch = appTag.match(/android:allowBackup\s*=\s*["'](true|false)["']/i);
    result.applicationAttrs.allowBackup = backupMatch?.[1] !== 'false';
    const usesCleartextMatch = appTag.match(/android:usesCleartextTraffic\s*=\s*["'](true|false)["']/i);
    result.applicationAttrs.usesCleartextTraffic = usesCleartextMatch?.[1] === 'true';
    const networkSecurityMatch = appTag.match(/android:networkSecurityConfig="([^"]+)"/i);
    result.applicationAttrs.networkSecurityConfig = !!networkSecurityMatch;
    const labelMatch = appTag.match(/android:label="([^"]+)"/i);
    result.applicationAttrs.label = labelMatch?.[1] || null;
  }

  // Count exported components
  const exportedRegex = /android:exported\s*=\s*["']true["']/gi;
  const exportedMatches = xmlContent.match(exportedRegex);
  result.exportedComponents = exportedMatches ? exportedMatches.length : 0;

  // Extract activities, services, receivers, providers with exported=true
  const componentRegex = /<(activity|service|receiver|provider)[^>]*android:exported\s*=\s*["']true["'][^>]*>/gi;
  while ((match = componentRegex.exec(xmlContent)) !== null) {
    const nameMatch = match[0].match(/android:name="([^"]+)"/i);
    const type = match[1];
    if (nameMatch) {
      result[`${type === 'activity' ? 'activities' : type === 'service' ? 'services' : type === 'receiver' ? 'receivers' : 'providers'}`].push({
        name: nameMatch[1],
        exported: true,
      });
    }
  }

  return result;
}

function analyzeSecurity(manifest: Record<string, any>, allFileStrings: string): AndroidSecurityFindings {
  const issues: Finding[] = [];
  const passed: Finding[] = [];
  const allPerms = manifest.permissions;
  const dangerousPerms = allPerms.filter(p => DANGEROUS_PERMISSIONS.has(p));
  const normalPerms = allPerms.filter(p => !DANGEROUS_PERMISSIONS.has(p));

  if (dangerousPerms.length > 5) {
    issues.push(createFinding('security', 'critical', 'Excessive Dangerous Permissions',
      `The app requests ${dangerousPerms.length} dangerous permissions: ${dangerousPerms.slice(0, 5).join(', ')}${dangerousPerms.length > 5 ? '...' : ''}. This is a privacy red flag.`,
      'Audit each permission and remove any that are not essential for core functionality. Consider using runtime permission requests with clear justifications.'));
  } else if (dangerousPerms.length > 0) {
    issues.push(createFinding('security', 'warning', 'Dangerous Permissions Requested',
      `Found ${dangerousPerms.length} dangerous permission(s): ${dangerousPerms.join(', ')}.`,
      'Ensure each dangerous permission has a clear justification and is requested at runtime with user explanation.'));
  } else {
    passed.push(createFinding('security', 'passed', 'No Dangerous Permissions',
      'The app does not request any dangerous permissions.'));
  }

  if (manifest.applicationAttrs.debuggable) {
    issues.push(createFinding('security', 'critical', 'App is Debuggable',
      'The app has android:debuggable="true" in the manifest. This allows inspection and modification of the app at runtime.',
      'Set android:debuggable="false" for release builds. Use build variants to manage debug vs release configurations.'));
  } else {
    passed.push(createFinding('security', 'passed', 'Debuggable Flag Disabled',
      'The app is not debuggable in this build.'));
  }

  if (manifest.applicationAttrs.allowBackup) {
    issues.push(createFinding('security', 'warning', 'Backup Enabled',
      'android:allowBackup is true, which may allow data extraction via adb backup.',
      'Set android:allowBackup="false" if the app handles sensitive data.'));
  } else {
    passed.push(createFinding('security', 'passed', 'Backup Disabled',
      'App data cannot be backed up via adb.'));
  }

  if (manifest.applicationAttrs.usesCleartextTraffic) {
    issues.push(createFinding('security', 'critical', 'Cleartext Traffic Allowed',
      'android:usesCleartextTraffic is true, allowing unencrypted HTTP connections.',
      'Disable cleartext traffic. Use HTTPS for all network communications.'));
  } else {
    passed.push(createFinding('security', 'passed', 'Cleartext Traffic Disabled',
      'The app does not allow cleartext (HTTP) traffic.'));
  }

  if (manifest.exportedComponents > 5) {
    issues.push(createFinding('security', 'warning', 'Many Exported Components',
      `${manifest.exportedComponents} components have android:exported="true", increasing the attack surface.`,
      'Minimize exported components. Use intent filters carefully and set exported="false" by default.'));
  } else if (manifest.exportedComponents > 0) {
    issues.push(createFinding('security', 'info', 'Exported Components Found',
      `${manifest.exportedComponents} component(s) are exported and accessible to other apps.`,
      'Review each exported component to ensure it has proper permission protection.'));
  } else {
    passed.push(createFinding('security', 'passed', 'No Exported Components',
      'No components are exported, reducing attack surface.'));
  }

  const hasNetworkConfig = manifest.applicationAttrs.networkSecurityConfig;
  if (hasNetworkConfig) {
    passed.push(createFinding('security', 'passed', 'Network Security Config',
      'A network security configuration file is defined, allowing certificate pinning and custom trust settings.'));
  } else {
    issues.push(createFinding('security', 'info', 'No Network Security Config',
      'No networkSecurityConfig is defined. Certificate pinning is not configured.',
      'Add a network_security_config.xml to enforce certificate pinning for sensitive API endpoints.'));
  }

  // Check for hardcoded secrets in DEX and resource strings
  const hardcodedSecrets: string[] = [];
  for (const { pattern, label } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const matches = allFileStrings.match(pattern);
    if (matches && matches.length > 0) {
      hardcodedSecrets.push(`${label} (${matches.length} found)`);
    }
  }
  if (hardcodedSecrets.length > 0) {
    issues.push(createFinding('security', 'critical', 'Potential Hardcoded Secrets',
      `Found potential hardcoded secrets: ${hardcodedSecrets.join(', ')}.`,
      'Move all API keys and secrets to environment variables or a secure backend. Never commit secrets to source control or bundle them in the APK.'));
  } else {
    passed.push(createFinding('security', 'passed', 'No Hardcoded Secrets Detected',
      'No common hardcoded secret patterns found in binary analysis.'));
  }

  let score = 100;
  if (dangerousPerms.length > 5) score -= 25; else if (dangerousPerms.length > 0) score -= 10;
  if (manifest.applicationAttrs.debuggable) score -= 25;
  if (manifest.applicationAttrs.allowBackup) score -= 10;
  if (manifest.applicationAttrs.usesCleartextTraffic) score -= 20;
  if (manifest.exportedComponents > 5) score -= 10; else if (manifest.exportedComponents > 0) score -= 3;
  if (!hasNetworkConfig) score -= 5;
  if (hardcodedSecrets.length > 0) score -= 20;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    totalPermissions: allPerms.length,
    dangerousPermissions: dangerousPerms,
    normalPermissions: normalPerms,
    isDebuggable: manifest.applicationAttrs.debuggable || false,
    allowsBackup: manifest.applicationAttrs.allowBackup ?? true,
    usesCleartextTraffic: manifest.applicationAttrs.usesCleartextTraffic || false,
    exportedComponents: manifest.exportedComponents,
    networkSecurityConfig: hasNetworkConfig,
    certificatePinning: hasNetworkConfig,
    hardcodedSecrets,
    issues,
    passed,
  };
}

function analyzeConfiguration(manifest: Record<string, any>, zip: AdmZip): AndroidConfigFindings {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Parse package info from manifest
  const pkgMatch = zip.readAsText('AndroidManifest.xml')?.match(/package="([^"]+)"/i);
  const packageName = pkgMatch?.[1] || 'unknown';

  // Try to read apktool-style decoded manifest for version info
  let versionName: string | null = null;
  let versionCode: string | null = null;
  let minSdkVersion: number | null = null;
  let targetSdkVersion: number | null = null;
  let compileSdkVersion: number | null = null;

  // Try binary manifest parsing (basic attribute extraction from raw bytes)
  const manifestEntry = zip.getEntry('AndroidManifest.xml');
  if (manifestEntry) {
    const manifestBytes = manifestEntry.getData();
    const text = extractTextFromBinary(manifestBytes);

    // Version info often appears as strings in the binary XML
    const vnMatch = text.match(/versionName[=:]\s*([^\s,;]+)/i);
    versionName = vnMatch?.[1] || null;

    const vcMatch = text.match(/versionCode[=:]\s*([^\s,;]+)/i);
    versionCode = vcMatch?.[1] || null;

    const minMatch = text.match(/minSdkVersion[=:]\s*(\d+)/i);
    minSdkVersion = minMatch ? parseInt(minMatch[1]) : null;

    const targetMatch = text.match(/targetSdkVersion[=:]\s*(\d+)/i);
    targetSdkVersion = targetMatch ? parseInt(targetMatch[1]) : null;

    const compileMatch = text.match(/compileSdkVersion[=:]\s*(\d+)/i);
    compileSdkVersion = compileMatch ? parseInt(compileMatch[1]) : null;
  }

  // Detect architectures from lib folders
  const supportedArchitectures: string[] = [];
  const archMap: Record<string, string> = {
    'armeabi-v7a': 'armv7a (32-bit)',
    'arm64-v8a': 'arm64 (64-bit)',
    'x86': 'x86 (32-bit)',
    'x86_64': 'x86_64 (64-bit)',
    'armeabi': 'armeabi (legacy)',
  };
  zip.getEntries().forEach(entry => {
    if (entry.entryName.startsWith('lib/')) {
      const parts = entry.entryName.split('/');
      if (parts.length >= 2 && archMap[parts[1]]) {
        if (!supportedArchitectures.includes(archMap[parts[1]])) {
          supportedArchitectures.push(archMap[parts[1]]);
        }
      }
    }
  });

  // SDK version analysis
  if (minSdkVersion !== null) {
    if (minSdkVersion < 21) {
      issues.push(createFinding('configuration', 'warning', 'Low Min SDK Version',
        `minSdkVersion is ${minSdkVersion} (Android ${minSdkVersion < 14 ? '4.0' : minSdkVersion < 19 ? '4.4' : '5.0'}). This supports very old devices with known security vulnerabilities.`,
        'Consider raising minSdkVersion to at least 21 (Android 5.0 Lollipop) to improve security and reduce testing burden.'));
    } else if (minSdkVersion >= 24) {
      passed.push(createFinding('configuration', 'passed', 'Modern Min SDK Version',
        `minSdkVersion is ${minSdkVersion}, supporting modern Android versions.`));
    } else {
      passed.push(createFinding('configuration', 'passed', 'Reasonable Min SDK Version',
        `minSdkVersion is ${minSdkVersion}.`));
    }
  }

  if (targetSdkVersion !== null) {
    if (targetSdkVersion < 30) {
      issues.push(createFinding('configuration', 'warning', 'Outdated Target SDK',
        `targetSdkVersion is ${targetSdkVersion}. Google Play requires targetSdkVersion 30+ for new apps.`,
        'Update targetSdkVersion to the latest stable version (33+) for best security and behavior.'));
    } else {
      passed.push(createFinding('configuration', 'passed', 'Modern Target SDK',
        `targetSdkVersion is ${targetSdkVersion}, meeting current Play Store requirements.`));
    }
  }

  if (supportedArchitectures.length === 0) {
    passed.push(createFinding('configuration', 'passed', 'No Native Libraries',
      'The app does not contain native libraries, which simplifies compatibility.'));
  } else if (supportedArchitectures.includes('armeabi (legacy)')) {
    issues.push(createFinding('configuration', 'info', 'Legacy Architecture Support',
      'The app includes the legacy armeabi architecture. This is no longer supported in NDK r17+.',
      'Remove armeabi support and keep only arm64-v8a for modern devices.'));
  }

  let score = 100;
  if (minSdkVersion !== null && minSdkVersion < 21) score -= 15;
  if (targetSdkVersion !== null && targetSdkVersion < 30) score -= 20;
  if (supportedArchitectures.includes('armeabi (legacy)')) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    packageName,
    versionName,
    versionCode,
    minSdkVersion,
    targetSdkVersion,
    compileSdkVersion,
    usesFeatureList: manifest.usesFeatures,
    supportedArchitectures,
    issues,
    passed,
  };
}

function analyzePrivacy(manifest: Record<string, any>, allFileStrings: string, zip: AdmZip): AndroidPrivacyFindings {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Detect tracker SDKs from DEX class names
  const trackersFound: string[] = [];
  const analyticsSdks: string[] = [];
  const adSdks: string[] = [];
  const socialSdks: string[] = [];

  const detectSdks = (sdkList: string[], category: string, targetArray: string[]) => {
    for (const sdk of sdkList) {
      if (allFileStrings.includes(sdk)) {
        const shortName = sdk.split('.').slice(-2).join('.');
        if (!targetArray.includes(shortName)) {
          targetArray.push(shortName);
          trackersFound.push(`${category}: ${shortName}`);
        }
      }
    }
  };

  detectSdks(ANALYTICS_SDKS, 'Analytics', analyticsSdks);
  detectSdks(AD_SDKS, 'Ad SDK', adSdks);
  detectSdks(SOCIAL_SDKS, 'Social', socialSdks);

  if (trackersFound.length > 5) {
    issues.push(createFinding('privacy', 'warning', 'Many Tracker SDKs',
      `Found ${trackersFound.length} tracker/analytics/ad SDKs: ${trackersFound.slice(0, 5).join(', ')}.`,
      'Reduce tracker SDKs to only those that are essential. Each SDK increases data collection and attack surface.'));
  } else if (trackersFound.length > 0) {
    issues.push(createFinding('privacy', 'info', 'Tracker SDKs Detected',
      `Found ${trackersFound.length} tracker SDK(s): ${trackersFound.join(', ')}.`,
      'Review each tracker SDK for data collection necessity. Ensure proper disclosure in privacy policy.'));
  } else {
    passed.push(createFinding('privacy', 'passed', 'No Known Tracker SDKs',
      'No well-known analytics, ad, or social tracking SDKs detected.'));
  }

  // Check for dangerous broadcast receivers
  const dangerousReceivers: string[] = [];
  const dangerousReceiverPatterns = [
    'android.intent.action.BOOT_COMPLETED',
    'android.intent.action.SMS_RECEIVED',
    'android.intent.action.NEW_OUTGOING_CALL',
    'android.intent.action.PHONE_STATE',
  ];
  for (const pattern of dangerousReceiverPatterns) {
    if (allFileStrings.includes(pattern)) {
      dangerousReceivers.push(pattern.split('.').pop() || pattern);
    }
  }
  if (dangerousReceivers.length > 0) {
    issues.push(createFinding('privacy', 'warning', 'Sensitive Broadcast Receivers',
      `The app registers receivers for: ${dangerousReceivers.join(', ')}. These can intercept sensitive user data.`,
      'Ensure these receivers have proper permission protection and document why they are needed.'));
  } else {
    passed.push(createFinding('privacy', 'passed', 'No Sensitive Broadcast Receivers',
      'The app does not register receivers for sensitive system broadcasts.'));
  }

  // Check if permissions match actual usage (basic heuristic)
  const hasSmsPerms = manifest.permissions.some(p => p.includes('SMS'));
  const hasCallPerms = manifest.permissions.some(p => p.includes('CALL') || p.includes('PHONE'));
  if (hasSmsPerms || hasCallPerms) {
    issues.push(createFinding('privacy', 'warning', 'SMS/Call Permissions',
      'The app requests SMS or Call-related permissions. These are highly sensitive.',
      'Ensure these permissions are strictly necessary and provide clear justification to users.'));
  }

  let score = 100;
  if (trackersFound.length > 5) score -= 20; else if (trackersFound.length > 0) score -= 10;
  if (dangerousReceivers.length > 0) score -= 15;
  if (hasSmsPerms || hasCallPerms) score -= 15;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    trackersFound,
    analyticsSdks,
    adSdks,
    socialSdks,
    dangerousReceivers,
    issues,
    passed,
  };
}

function analyzeCodeQuality(zip: AdmZip, allFileStrings: string): AndroidCodeQualityFindings {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  // Check for ProGuard/R8
  const hasProguard = zip.getEntries().some(e =>
    e.entryName.includes('proguard') || e.entryName.includes('proguard-rules')
  );

  if (hasProguard) {
    passed.push(createFinding('codeQuality', 'passed', 'ProGuard/R8 Configured',
      'ProGuard rules file found, indicating code obfuscation is configured.'));
  } else {
    issues.push(createFinding('codeQuality', 'warning', 'No ProGuard Configuration',
      'No ProGuard rules file found. Code may not be obfuscated.',
      'Enable minification and obfuscation via ProGuard/R8 in release builds.'));
  }

  // Check for obfuscation (heuristic: if class files have short names like a/b/c)
  const isObfuscated = /\/[a-z]\/[a-z]\.dex/.test(
    zip.getEntries().map(e => e.entryName).join('\n')
  );

  if (isObfuscated || hasProguard) {
    passed.push(createFinding('codeQuality', 'passed', 'Code Obfuscation',
      hasProguard ? 'ProGuard is configured for release builds.' : 'DEX files appear to be obfuscated.'));
  } else if (!hasProguard) {
    issues.push(createFinding('codeQuality', 'warning', 'Code Not Obfuscated',
      'Code does not appear to be obfuscated, making reverse engineering easier.',
      'Enable R8/ProGuard obfuscation for release builds.'));
  }

  // Calculate DEX size
  let totalDexSize = 0;
  const dexFiles: string[] = [];
  zip.getEntries().forEach(e => {
    if (e.entryName.endsWith('.dex')) {
      totalDexSize += e.header.size;
      dexFiles.push(e.entryName);
    }
  });

  if (dexFiles.length > 1) {
    issues.push(createFinding('codeQuality', 'info', 'Multi-DEX Build',
      `Found ${dexFiles.length} DEX files, indicating a large codebase exceeding the 64K method limit.`,
      'Review dependencies and remove unused ones to potentially eliminate multi-DEX overhead.'));
  }

  // Detect native libraries
  const nativeLibraries: string[] = [];
  zip.getEntries().forEach(e => {
    if (e.entryName.startsWith('lib/') && e.entryName.endsWith('.so')) {
      const name = e.entryName.split('/').pop() || '';
      if (!nativeLibraries.includes(name)) nativeLibraries.push(name);
    }
  });

  if (nativeLibraries.length > 0) {
    passed.push(createFinding('codeQuality', 'passed', 'Native Libraries',
      `${nativeLibraries.length} native library(ies) found: ${nativeLibraries.slice(0, 3).join(', ')}${nativeLibraries.length > 3 ? '...' : ''}.`));
  }

  // Detect third-party libraries from common package patterns in DEX strings
  const thirdPartyPatterns = [
    { pattern: /com\/google\//g, name: 'Google Services' },
    { pattern: /com\/facebook\//g, name: 'Facebook SDK' },
    { pattern: /com\/squareup\//g, name: 'Square (OkHttp, Retrofit)' },
    { pattern: /com\/android\/volley/g, name: 'Volley' },
    { pattern: /org\/apache\//g, name: 'Apache Libraries' },
    { pattern: /com\/airbnb\//g, name: 'Airbnb SDKs (Lottie, Epoxy)' },
    { pattern: /com\/google\/android\/material/g, name: 'Material Components' },
    { pattern: /androidx\//g, name: 'AndroidX' },
    { pattern: /io\/reactivex/g, name: 'RxJava' },
    { pattern: /com\/uber\/autodispose/g, name: 'AutoDispose' },
    { pattern: /com\/jakewharton\//g, name: 'JakeWharton Libraries' },
    { pattern: /com\/github\//g, name: 'GitHub Libraries' },
    { pattern: /org\/jetbrains\//g, name: 'Kotlin/JetBrains' },
    { pattern: /kotlin\//g, name: 'Kotlin Runtime' },
    { pattern: /com\/bumptech\//g, name: 'Glide' },
    { pattern: /coil-kt/g, name: 'Coil' },
    { pattern: /com\/google\/dagger/g, name: 'Dagger' },
    { pattern: /com\/google\/firebase/g, name: 'Firebase' },
    { pattern: /com\/newrelic/g, name: 'New Relic' },
    { pattern: /com\/crashlytics/g, name: 'Crashlytics' },
  ];

  const thirdPartyLibraries: string[] = [];
  for (const { pattern, name } of thirdPartyPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(allFileStrings)) {
      thirdPartyLibraries.push(name);
    }
  }

  if (thirdPartyLibraries.length > 10) {
    issues.push(createFinding('codeQuality', 'info', 'Many Third-Party Libraries',
      `Detected ${thirdPartyLibraries.length} third-party libraries. Each is a potential supply chain risk.`,
      'Audit all third-party dependencies for security vulnerabilities and remove unused ones.'));
  } else if (thirdPartyLibraries.length > 0) {
    passed.push(createFinding('codeQuality', 'passed', 'Third-Party Libraries',
      `Found ${thirdPartyLibraries.length} third-party libraries: ${thirdPartyLibraries.join(', ')}.`));
  }

  // Check for deprecated API usage patterns
  const deprecatedApis: string[] = [];
  const deprecatedPatterns = [
    { pattern: /android\.os\.AsyncTask/g, name: 'AsyncTask' },
    { pattern: /org\.apache\.http/g, name: 'Apache HTTP Client' },
    { pattern: /android\.widget\.AbsoluteLayout/g, name: 'AbsoluteLayout' },
    { pattern: /android\.hardware\.Camera\b/g, name: 'Camera (deprecated, use CameraX)' },
    { pattern: /getFragmentManager\b/g, name: 'getFragmentManager (use getSupportFragmentManager)' },
  ];
  for (const { pattern, name } of deprecatedPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(allFileStrings)) {
      deprecatedApis.push(name);
    }
  }
  if (deprecatedApis.length > 0) {
    issues.push(createFinding('codeQuality', 'warning', 'Deprecated API Usage',
      `Found usage of deprecated APIs: ${deprecatedApis.join(', ')}.`,
      'Migrate to modern replacements to ensure future compatibility.'));
  } else {
    passed.push(createFinding('codeQuality', 'passed', 'No Deprecated APIs Detected',
      'No common deprecated Android API patterns found.'));
  }

  let score = 100;
  if (!hasProguard) score -= 15;
  if (dexFiles.length > 1) score -= 5;
  if (thirdPartyLibraries.length > 10) score -= 5;
  if (deprecatedApis.length > 0) score -= 10;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    hasProguard,
    isObfuscated: isObfuscated || hasProguard,
    totalDexSize,
    nativeLibraries,
    thirdPartyLibraries,
    deprecatedApis,
    issues,
    passed,
  };
}

function analyzePerformance(zip: AdmZip, apkSizeBytes: number): AndroidPerfFindings {
  const issues: Finding[] = [];
  const passed: Finding[] = [];

  const entries = zip.getEntries();
  const totalFiles = entries.length;
  let resourceCount = 0;
  let assetCount = 0;
  const largeAssets: string[] = [];
  const duplicateFiles: string[] = [];
  const uncompressedAssets: string[] = [];

  const fileSizes: Record<string, number> = {};

  for (const entry of entries) {
    const size = entry.header.size;

    if (entry.entryName.startsWith('res/')) {
      resourceCount++;
    } else if (entry.entryName.startsWith('assets/')) {
      assetCount++;
      // Check for large assets (>5MB)
      if (size > 5 * 1024 * 1024) {
        largeAssets.push(`${entry.entryName} (${(size / 1024 / 1024).toFixed(1)}MB)`);
      }
      // Check for uncompressed assets
      if (size > 100 * 1024 && !entry.header.compressed) {
        uncompressedAssets.push(entry.entryName);
      }
    }

    // Track for duplicates
    const fileName = entry.entryName.split('/').pop() || '';
    if (fileName) {
      fileSizes[fileName] = (fileSizes[fileName] || 0) + size;
    }
  }

  // APK size analysis
  if (apkSizeBytes > 100 * 1024 * 1024) {
    issues.push(createFinding('performance', 'critical', 'Very Large APK',
      `APK size is ${(apkSizeBytes / 1024 / 1024).toFixed(1)}MB. This exceeds the 100MB Google Play limit for initial installs.`,
      'Use App Bundles (AAB), remove unused resources, compress assets, and consider on-demand delivery.'));
  } else if (apkSizeBytes > 50 * 1024 * 1024) {
    issues.push(createFinding('performance', 'warning', 'Large APK',
      `APK size is ${(apkSizeBytes / 1024 / 1024).toFixed(1)}MB. Large APKs have lower install conversion rates.`,
      'Use Android App Bundle, enable resource shrinking, and compress large assets.'));
  } else if (apkSizeBytes > 20 * 1024 * 1024) {
    issues.push(createFinding('performance', 'info', 'Moderate APK Size',
      `APK size is ${(apkSizeBytes / 1024 / 1024).toFixed(1)}MB. There may be room for optimization.`,
      'Review large assets and unused resources to reduce size.'));
  } else {
    passed.push(createFinding('performance', 'passed', 'Optimized APK Size',
      `APK size is ${(apkSizeBytes / 1024 / 1024).toFixed(1)}MB, well within recommended limits.`));
  }

  if (largeAssets.length > 0) {
    issues.push(createFinding('performance', 'warning', 'Large Asset Files',
      `Found ${largeAssets.length} asset(s) over 5MB: ${largeAssets.slice(0, 3).join(', ')}.`,
      'Compress assets, use WebP for images, or consider downloading them on first launch.'));
  }

  if (uncompressedAssets.length > 0) {
    issues.push(createFinding('performance', 'info', 'Uncompressed Assets',
      `${uncompressedAssets.length} asset(s) are stored uncompressed, wasting space.`,
      'Ensure assets are compressed using aaptOptions { noCompress } only when necessary (e.g., .mp3, .mp4).'));
  }

  if (resourceCount > 1000) {
    issues.push(createFinding('performance', 'info', 'Many Resources',
      `Found ${resourceCount} resource files. Consider removing unused resources.`,
      'Enable resource shrinking: android { buildTypes { release { shrinkResources true } } }'));
  }

  let score = 100;
  if (apkSizeBytes > 100 * 1024 * 1024) score -= 35;
  else if (apkSizeBytes > 50 * 1024 * 1024) score -= 20;
  else if (apkSizeBytes > 20 * 1024 * 1024) score -= 8;
  if (largeAssets.length > 0) score -= 10;
  if (uncompressedAssets.length > 3) score -= 5;
  if (resourceCount > 1000) score -= 5;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    apkSizeBytes,
    totalFiles,
    resourceCount,
    assetCount,
    largeAssets,
    duplicateFiles: duplicateFiles.length,
    uncompressedAssets,
    issues,
    passed,
  };
}

export interface AndroidAuditResult {
  findings: AndroidFindings;
  healthScore: number;
  securityScore: number;
  performanceScore: number;
  seoScore: number; // Maps to configuration
  accessibilityScore: number; // Maps to privacy
  uxScore: number; // Maps to code quality
  responseTime: number;
  pageSize: number; // APK size
}

export async function runAndroidAudit(apkBuffer: Buffer, apkSize: number): Promise<AndroidAuditResult> {
  const startTime = Date.now();

  let zip: AdmZip;
  try {
    zip = new AdmZip(apkBuffer);
  } catch (err) {
    throw new Error('Invalid APK file. Could not parse the ZIP structure.');
  }

  // Extract all file content as strings for pattern matching
  let allFileStrings = '';
  for (const entry of zip.getEntries()) {
    try {
      if (entry.entryName.endsWith('.dex') || entry.entryName.endsWith('.so')) {
        allFileStrings += extractTextFromBinary(entry.getData()) + '\n';
      } else if (entry.entryName.endsWith('.xml') || entry.entryName.endsWith('.json') || entry.entryName.endsWith('.properties')) {
        allFileStrings += zip.readAsText(entry) + '\n';
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Parse AndroidManifest.xml (try text first, fallback to binary extraction)
  let manifestXml = '';
  try {
    manifestXml = zip.readAsText('AndroidManifest.xml');
    // If it's binary XML (garbled), extract strings instead
    if (!manifestXml.includes('<manifest') && !manifestXml.includes('<application')) {
      const manifestEntry = zip.getEntry('AndroidManifest.xml');
      if (manifestEntry) {
        manifestXml = extractTextFromBinary(manifestEntry.getData());
      }
    }
  } catch {
    const manifestEntry = zip.getEntry('AndroidManifest.xml');
    if (manifestEntry) {
      manifestXml = extractTextFromBinary(manifestEntry.getData());
    }
  }

  const manifest = parseManifestXml(manifestXml);

  // Run all analyses
  const security = analyzeSecurity(manifest, allFileStrings);
  const configuration = analyzeConfiguration(manifest, zip);
  const privacy = analyzePrivacy(manifest, allFileStrings, zip);
  const codeQuality = analyzeCodeQuality(zip, allFileStrings);
  const performance = analyzePerformance(zip, apkSize);

  const responseTime = Date.now() - startTime;

  // Health score: weighted average
  // securityScore → security field
  // seoScore → configuration field
  // accessibilityScore → privacy field
  // uxScore → codeQuality field
  // performanceScore → performance field
  const securityScore = security.score;
  const seoScore = configuration.score; // Configuration mapped to seoScore
  const accessibilityScore = privacy.score; // Privacy mapped to accessibilityScore
  const uxScore = codeQuality.score; // Code quality mapped to uxScore
  const performanceScore = performance.score;

  const healthScore = Math.round(
    securityScore * 0.30 +
    performanceScore * 0.20 +
    seoScore * 0.15 +
    accessibilityScore * 0.20 +
    uxScore * 0.15
  );

  return {
    findings: { security, configuration, privacy, codeQuality, performance },
    healthScore,
    securityScore,
    performanceScore,
    seoScore,
    accessibilityScore,
    uxScore,
    responseTime,
    pageSize: apkSize, // APK size stored in pageSize field
  };
}