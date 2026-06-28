export interface AuditFindings {
  performance: PerformanceFindings;
  seo: SeoFindings;
  accessibility: AccessibilityFindings;
  security: SecurityFindings;
  ux: UxFindings;
}

export interface PerformanceFindings {
  score: number;
  responseTime: number;
  pageSize: number;
  htmlSize: number;
  // Deep audit extras
  fcp?: number | null;
  lcp?: number | null;
  cls?: number | null;
  domNodes?: number | null;
  layoutShifts?: number | null;
  consoleErrors?: number;
  blockedResources?: number;
  issues: Finding[];
  passed: Finding[];
}

export interface SeoFindings {
  score: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  canonicalUrl: string | null;
  ogTags: Record<string, string>;
  headingStructure: HeadingItem[];
  // Deep audit extras
  renderedTitle?: string | null;
  hasSitemap?: boolean;
  hasRobotsTxt?: boolean;
  brokenLinks?: number;
  issues: Finding[];
  passed: Finding[];
}

export interface HeadingItem {
  level: number;
  text: string;
}

export interface AccessibilityFindings {
  score: number;
  imagesWithoutAlt: number;
  totalImages: number;
  missingLabels: number;
  hasLang: boolean;
  issues: Finding[];
  passed: Finding[];
}

export interface SecurityFindings {
  score: number;
  isHttps: boolean;
  headers: Record<string, string | null>;
  // Deep audit extras
  mixedContentCount?: number;
  vulnerableLibraries?: string[];
  issues: Finding[];
  passed: Finding[];
}

export interface UxFindings {
  score: number;
  hasViewport: boolean;
  hasFavicon: boolean;
  linkCount: number;
  externalLinks: number;
  // Deep audit extras
  responsiveIssues?: string[];
  screenshotTaken?: boolean;
  issues: Finding[];
  passed: Finding[];
}

export interface Finding {
  category: string;
  severity: 'critical' | 'warning' | 'info' | 'passed';
  title: string;
  description: string;
  recommendation?: string;
}

export interface AiSummary {
  executiveSummary: string;
  keyStrengths: string[];
  criticalIssues: string[];
  recommendations: string[];
  priorityActions: string[];
}

// Android-specific types
export interface AndroidFindings {
  security: AndroidSecurityFindings;
  configuration: AndroidConfigFindings;
  privacy: AndroidPrivacyFindings;
  codeQuality: AndroidCodeQualityFindings;
  performance: AndroidPerfFindings;
}

export interface AndroidSecurityFindings {
  score: number;
  totalPermissions: number;
  dangerousPermissions: string[];
  normalPermissions: string[];
  isDebuggable: boolean;
  allowsBackup: boolean;
  usesCleartextTraffic: boolean;
  exportedComponents: number;
  networkSecurityConfig: boolean;
  certificatePinning: boolean;
  hardcodedSecrets: string[];
  issues: Finding[];
  passed: Finding[];
}

export interface AndroidConfigFindings {
  score: number;
  packageName: string;
  versionName: string | null;
  versionCode: string | null;
  minSdkVersion: number | null;
  targetSdkVersion: number | null;
  compileSdkVersion: number | null;
  usesFeatureList: string[];
  supportedArchitectures: string[];
  issues: Finding[];
  passed: Finding[];
}

export interface AndroidPrivacyFindings {
  score: number;
  trackersFound: string[];
  analyticsSdks: string[];
  adSdks: string[];
  socialSdks: string[];
  dangerousReceivers: string[];
  issues: Finding[];
  passed: Finding[];
}

export interface AndroidCodeQualityFindings {
  score: number;
  hasProguard: boolean;
  isObfuscated: boolean;
  totalDexSize: number;
  nativeLibraries: string[];
  thirdPartyLibraries: string[];
  deprecatedApis: string[];
  issues: Finding[];
  passed: Finding[];
}

export interface AndroidPerfFindings {
  score: number;
  apkSizeBytes: number;
  totalFiles: number;
  resourceCount: number;
  assetCount: number;
  largeAssets: string[];
  duplicateFiles: number;
  uncompressedAssets: string[];
  issues: Finding[];
  passed: Finding[];
}

export type ProjectType = 'website' | 'android';
export type AuditMode = 'simple' | 'deep';

export interface AuditResult {
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  securityScore: number;
  uxScore: number;
  findings: AuditFindings;
  androidFindings?: AndroidFindings;
  aiSummary: AiSummary | null;
  responseTime: number;
  pageSize: number;
  auditedAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalAudits: number;
  avgHealthScore: number;
  recentAudits: AuditWithProject[];
}

export interface AuditWithProject {
  id: string;
  status: string;
  mode: string;
  healthScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  accessibilityScore: number | null;
  securityScore: number | null;
  uxScore: number | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    url: string;
    type: string;
  };
}

export type ViewType = 'landing' | 'dashboard' | 'projects' | 'project-detail' | 'audit-results';