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
  issues: Finding[];
  passed: Finding[];
}

export interface UxFindings {
  score: number;
  hasViewport: boolean;
  hasFavicon: boolean;
  linkCount: number;
  externalLinks: number;
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

export interface AuditResult {
  healthScore: number;
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  securityScore: number;
  uxScore: number;
  findings: AuditFindings;
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
  };
}

export type ViewType = 'landing' | 'dashboard' | 'projects' | 'project-detail' | 'audit-results';