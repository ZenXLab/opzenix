import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  GitMerge,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getBranchType,
  isPromotionEligible,
  type BranchPattern,
  BRANCH_PATTERNS,
} from '@/lib/opzenix-constants';

// ============================================
// 🔒 OPZENIX BRANCH VALIDATION (LOCKED MVP 1.0.0)
// ============================================
// Trunk-Based Branching Model:
// - feature/* and bugfix/* = CI only, NO CD
// - main = Full CI/CD and promotion eligible
// ============================================

interface BranchValidationProps {
  branch: string;
  showDetails?: boolean;
}

export const BranchValidationBadge = memo(({ branch, showDetails = false }: BranchValidationProps) => {
  const branchInfo = getBranchType(branch);
  const eligible = isPromotionEligible(branch);

  if (!branchInfo) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <XCircle className="w-3 h-3" />
        Invalid Branch
      </Badge>
    );
  }

  const config = {
    feature: {
      icon: GitBranch,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      label: 'Feature Branch',
    },
    bugfix: {
      icon: GitBranch,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      label: 'Bugfix Branch',
    },
    main: {
      icon: GitMerge,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      label: 'Main Branch',
    },
  };

  const { icon: Icon, color, bgColor, borderColor, label } = config[branchInfo.type];

  return (
    <div className={cn('inline-flex flex-col gap-2', showDetails && 'w-full')}>
      <Badge 
        variant="outline" 
        className={cn('gap-1.5 border', borderColor, bgColor, color)}
      >
        <Icon className="w-3 h-3" />
        {label}
        <span className="font-mono text-[10px] opacity-70">({branch})</span>
      </Badge>

      {showDetails && (
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            {branchInfo.allowsCI ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className="text-muted-foreground">CI Pipeline</span>
            <span className={branchInfo.allowsCI ? 'text-emerald-400' : 'text-red-400'}>
              {branchInfo.allowsCI ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {branchInfo.allowsCD ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">CD Deployment</span>
            <span className={branchInfo.allowsCD ? 'text-emerald-400' : 'text-muted-foreground'}>
              {branchInfo.allowsCD ? 'Enabled' : 'Not Allowed'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {eligible ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Promotion</span>
            <span className={eligible ? 'text-emerald-400' : 'text-muted-foreground'}>
              {eligible ? 'Eligible' : 'Not Eligible'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
BranchValidationBadge.displayName = 'BranchValidationBadge';

// CI/CD Eligibility Banner
interface CICDEligibilityBannerProps {
  branch: string;
  onMergeToMain?: () => void;
}

export const CICDEligibilityBanner = memo(({ branch, onMergeToMain }: CICDEligibilityBannerProps) => {
  const branchInfo = getBranchType(branch);
  const eligible = isPromotionEligible(branch);

  if (!branchInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
      >
        <XCircle className="w-5 h-5 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">Invalid Branch Pattern</p>
          <p className="text-xs text-muted-foreground">
            Only feature/*, bugfix/*, and main branches are allowed
          </p>
        </div>
      </motion.div>
    );
  }

  if (branchInfo.type === 'main') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-400">Promotion Eligible</p>
          <p className="text-xs text-muted-foreground">
            Artifacts built from main are eligible for environment promotion
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
          CI + CD
        </Badge>
      </motion.div>
    );
  }

  // Feature or bugfix branch
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-400">CI Only - No Deployment</p>
        <p className="text-xs text-muted-foreground">
          {branchInfo.type === 'feature' ? 'Feature' : 'Bugfix'} branches run CI validation only. 
          Merge to main to enable CD and promotion.
        </p>
      </div>
      <Badge variant="outline" className="border-amber-500/30 text-amber-400">
        CI Only
      </Badge>
    </motion.div>
  );
});
CICDEligibilityBanner.displayName = 'CICDEligibilityBanner';

// Branch Strategy Legend
export const BranchStrategyLegend = memo(() => {
  return (
    <div className="p-4 bg-card border border-border rounded-lg space-y-4">
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Trunk-Based Branching (LOCKED)</h4>
      </div>

      <div className="space-y-3">
        {BRANCH_PATTERNS.map((pattern) => (
          <div key={pattern.type} className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
            <GitBranch className={cn(
              'w-4 h-4 mt-0.5',
              pattern.type === 'main' ? 'text-emerald-400' : 'text-blue-400'
            )} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {pattern.type === 'feature' ? 'feature/*' : 
                   pattern.type === 'bugfix' ? 'bugfix/*' : 'main'}
                </span>
                <div className="flex gap-1">
                  <Badge variant={pattern.allowsCI ? 'secondary' : 'outline'} className="text-[10px]">
                    CI {pattern.allowsCI ? '✓' : '✗'}
                  </Badge>
                  <Badge variant={pattern.allowsCD ? 'secondary' : 'outline'} className="text-[10px]">
                    CD {pattern.allowsCD ? '✓' : '✗'}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{pattern.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Rule:</strong> Only merges into main are eligible for deployment and promotion.
          No long-lived environment branches (NO dev, uat, staging, prod branches).
        </p>
      </div>
    </div>
  );
});
BranchStrategyLegend.displayName = 'BranchStrategyLegend';
