// Central icon registry — every icon used across the funnel comes from
// lucide-react, looked up by name so quizConfig.js can stay plain data
// (no JSX imports scattered through the config file).
import {
  Target, User, Search, AlertTriangle, Mail, Clock, Briefcase, Star,
  Sparkles, TrendingUp, TrendingDown, BarChart3, Brain, GraduationCap,
  Repeat, DollarSign, Footprints, Laptop, LineChart, HeartPulse,
  Megaphone, Palette, Settings, Eye, Sprout, Frown, FileText,
  LayoutGrid, ShieldAlert, Zap, Timer, Meh, Code2, Package, TreePine,
  Mountain, Leaf, Check, ThumbsDown,
} from 'lucide-react';

export const ICONS = {
  Target, User, Search, AlertTriangle, Mail, Clock, Briefcase, Star,
  Sparkles, TrendingUp, TrendingDown, BarChart3, Brain, GraduationCap,
  Repeat, DollarSign, Footprints, Laptop, LineChart, HeartPulse,
  Megaphone, Palette, Settings, Eye, Sprout, Frown, FileText,
  LayoutGrid, ShieldAlert, Zap, Timer, Meh, Code2, Package, TreePine,
  Mountain, Leaf, Check, ThumbsDown,
};

export function Icon({ name, ...props }) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return <Cmp {...props} />;
}
