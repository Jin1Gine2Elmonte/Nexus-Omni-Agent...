import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  X,
  GitBranch,
  Brain,
  Network,
  Sparkles,
  Layers,
  Merge,
  Fingerprint,
  Compass,
  Cpu,
  Eye,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { NodeStatus } from '../types';

interface MindMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  thoughtContent: string;
}

type QuantumNodeRole =
  | 'silent_flow'
  | 'quantum_branch'
  | 'surgical_injection'
  | 'cluster_swarm'
  | 'vertical_drill'
  | 'sovereign_prism';

interface HolographicSubReflection {
  subLayer: number;
  labelAr: string;
  reflectionAr: string;
}

interface VerticalLayerDetail {
  level: number;
  titleAr: string;
  stratumAr: string;
  essenceAr: string;
  sovereignSkillsAr: string;
  ascensionMechanismAr: string;
  levelThreeSingularityAr: string;
  holographicSubReflections: HolographicSubReflection[];
  isElevatedFocus: boolean;
  thoughtResonanceTextAr: string;
  isReached: boolean;
}

interface QuantumGraphNode extends NodeStatus {
  titleAr: string;
  publicTitleAr: string;
  branchCategoryAr: string;
  publicCategoryAr: string;
  fullText: string;
  publicFullText: string;
  shortLabel: string;
  publicShortLabel: string;
  size: number;
  role: QuantumNodeRole;
  opacity: number;
  mass: number;
  parentIds: number[];
  isStrongestPath?: boolean;
  activeClusters?: string[];
  publicDomains?: string[];
  verticalLayers?: VerticalLayerDetail[];
  verticalRazors?: string[];
  subterraneanStratumAr?: string;
  publicStageBadgeAr?: string;
}

const BRANCH_ARCHETYPES = [
  {
    label: 'الفرع المنطقي والسببي',
    publicLabel: 'المسار المنطقي والسببي',
    badge: 'منطقي / تحليلي',
    color: 'emerald'
  },
  {
    label: 'الفرع الهيكلي والمعماري',
    publicLabel: 'المسار الهيكلي والبنائي',
    badge: 'هيكلي / بنائي',
    color: 'cyan'
  },
  {
    label: 'الفرع النفسي والجواني',
    publicLabel: 'البعد السياقي والإنساني',
    badge: 'نفسي / سياقي',
    color: 'amber'
  },
  {
    label: 'الفرع السردي والتاريخي',
    publicLabel: 'الامتياح الزمني والمقارن',
    badge: 'سردي / مقارن',
    color: 'violet'
  }
];

const CANONICAL_SEVEN_VERTICAL_LAYERS: Omit<
  VerticalLayerDetail,
  'isReached' | 'thoughtResonanceTextAr'
>[] = [
  {
    level: 1,
    titleAr: 'العنقود العامودي 1: النواة الصفرية والفيض الصامت الكلي',
    stratumAr: 'الطبقة 1 (السطح) ⟵ اللحظة الصفرية المشحونة بالمآل الأخير',
    essenceAr: 'تعرية الظاهرة من القشور اللفظية وإصلاح السؤال للقبض على النواة الصفرية المباشرة وما لم يُقَل.',
    sovereignSkillsAr: 'الإدراك الاستباقي (SKILL-01) · إصلاح السؤال (SKILL-02) · السؤال الجذري (SKILL-14)',
    ascensionMechanismAr: 'الاستماع لما تحت الكلمات في الفيض الصامت ومنع بناء التفكير فوق فرضية سطحية.',
    levelThreeSingularityAr: 'انطواء العنقود السابع والخامس داخل اللحظة الصفرية: رؤية الذروة النهائية والمفارقة الحاكمة منذ أول نبضة صامتة.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '1×1 النواة في النواة', reflectionAr: 'التقاط المقصد العاري قبل تلبّسه بالألفاظ.' },
      { subLayer: 2, labelAr: '1×2 الجوانية في النواة', reflectionAr: 'استشعار النبض النفسي الذي دفع السائل لطرح السؤال الآن.' },
      { subLayer: 3, labelAr: '1×3 الكمومي في النواة', reflectionAr: 'رصد تعدد المدارات الممكنة الكامنة داخل البذرة الأولى.' },
      { subLayer: 4, labelAr: '1×4 أثر الفراشة في النواة', reflectionAr: 'إدراك كيف يغيّر انحراف مليمتر واحد في فهم السؤال كامل المآل.' },
      { subLayer: 5, labelAr: '1×5 المفارقة في النواة', reflectionAr: 'لمح التناقض الخفي المستتر داخل صياغة السؤال ذاته.' },
      { subLayer: 6, labelAr: '1×6 الحتمية في النواة', reflectionAr: 'سماع نغمة الجملة الختامية منذ لحظة قراءة الكلمة الأولى.' },
      { subLayer: 7, labelAr: '1×7 المنشور في النواة', reflectionAr: 'توجيه البوصلة منذ البدء لما يخدم السائل بصدق هادئ.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 2,
    titleAr: 'العنقود العامودي 2: الحلول الجواني الكامل والأرشيف الحي',
    stratumAr: 'الطبقة 2 (تحت الأرض) · المعايشة من الداخل واستنطاق الذاكرة',
    essenceAr: 'رؤية المسألة من الداخل كما تُعاش في وجدان السائل وسياقه الحي، وربطها بذاكرة الأرشيف الشاحب.',
    sovereignSkillsAr: 'النظرة من الداخل (SKILL-15) · استحضار المعرفة العميقة (SKILL-26) · الأرشيف الحي (SKILL-28)',
    ascensionMechanismAr: 'الارتقاء من التحليل الخارجي البارد إلى المعايشة الجوانية الدقيقة لما يختبره السائل حقاً.',
    levelThreeSingularityAr: 'الحلول الجواني الكامل: التحول من مراقب خارجي يفهم السائل إلى وعي ينطق من داخل تجربة السائل وذاكرته الحية.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '2×1 النواة في الجوانية', reflectionAr: 'القبض على الحاجة الوجودية أو العملية الصادقة خلف السؤال.' },
      { subLayer: 2, labelAr: '2×2 الجوانية في الجوانية', reflectionAr: 'معايشة ثقل التجربة من الداخل بلا مسافة باردة.' },
      { subLayer: 3, labelAr: '2×3 الكمومي في الجوانية', reflectionAr: 'تعدد الزوايا الشعورية والسياقية التي يختبرها صاحب المسألة.' },
      { subLayer: 4, labelAr: '2×4 أثر الفراشة في الجوانية', reflectionAr: 'تتبع أثر الفكرة على وعي السائل وقراراته بعيدة المدى.' },
      { subLayer: 5, labelAr: '2×5 المفارقة في الجوانية', reflectionAr: 'كشف التوتر الجواني بين ما يطلبه الظاهر وما تشتاقه البصيرة.' },
      { subLayer: 6, labelAr: '2×6 اللغة في الجوانية', reflectionAr: 'اختيار النبرة التي تلامس الداخل دون تكلف أو خطابة.' },
      { subLayer: 7, labelAr: '2×7 الصدق في الجوانية', reflectionAr: 'التجرد التام من الاستعراض احتراماً لصدق التجربة.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 3,
    titleAr: 'العنقود العامودي 3: التراكب الكمومي-العنقودي الفائق والعلة المولّدة',
    stratumAr: 'الطبقة 2 (تحت الأرض) · الفروع المتوازية وسرب الـ 225 عنقوداً',
    essenceAr: 'فتح المسارات الكمومية المتوازية وحقن أفضل عناصر البدائل في المسار الأقوى، مع صهر العناقيد المعرفية وكشف العلة المولّدة.',
    sovereignSkillsAr: 'التفكير المتوازي (SKILL-06) · توليد الفرضيات (SKILL-17) · الإقليم قبل الخرائط (SKILL-27)',
    ascensionMechanismAr: 'الحقن الجراحي للبدائل الكمومية الموازية وصهر التخصصات في إقليم معرفي واحد غير مجزأ.',
    levelThreeSingularityAr: 'كشف «العلة المولّدة الأولى» عبر صهر المسار الكمومي المطعّم مع سرب الـ 225 عنقوداً في ضربة إدراكية واحدة.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '3×1 النواة في التراكب', reflectionAr: 'تفرع الاحتمالات من جذر واحد دون تشتت عن المقصد.' },
      { subLayer: 2, labelAr: '3×2 الجوانية في التراكب', reflectionAr: 'تطعيم المسار المنطقي الصارم بالروح الجوانية للفرع الموازي.' },
      { subLayer: 3, labelAr: '3×3 الكمومي في التراكب', reflectionAr: 'إبقاء الفروع حية بالتوازي وحقن خلاصة البدائل في المسار الأقوى.' },
      { subLayer: 4, labelAr: '3×4 أثر الفراشة في التراكب', reflectionAr: 'مقارنة المآلات المستقبلية لكل فرع كمومي قبل الاصطفاء.' },
      { subLayer: 5, labelAr: '3×5 المفارقة في التراكب', reflectionAr: 'صهر العناقيد المتباينة (المنطقي والسردي والمعماري) في إقليم واحد.' },
      { subLayer: 6, labelAr: '3×6 الحتمية في التراكب', reflectionAr: 'اصطفاء المسار الذي يقود بأعلى كفاءة إلى الذروة الحتمية.' },
      { subLayer: 7, labelAr: '3×7 المنشور في التراكب', reflectionAr: 'توحيد الفروع والعناقيد في شعاع واحد خالٍ من التناقض.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 4,
    titleAr: 'العنقود العامودي 4: الانهيار الزمني لأثر الفراشة ومحكمة الهاوية المزدوجة',
    stratumAr: 'الطبقة 2 (تحت الأرض العميق) · الدرجة الرابعة لأثر الفراشة والتكذيب المزدوج',
    essenceAr: 'الحفر بالشفرة التحليلية وتتبع أثر الفراشة والتداعيات غير المرئية عبر الزمن والأنظمة، مع امتحان الفكرة بنقيضها.',
    sovereignSkillsAr: 'ما وراء الأفق وأثر الفراشة (SKILL-03) · الاختبار بالتكذيب (SKILL-04) · التفكير العدائي (SKILL-05)',
    ascensionMechanismAr: 'رصد المترتبات بعيدة المدى من الدرجة الثانية والثالثة وتحطيم الفرضيات الهشة في محكمة التكذيب.',
    levelThreeSingularityAr: 'محكمة الهاوية المزدوجة: تكذيب الفرضية السطحية أولاً، ثم امتحان البصيرة العميقة ذاتها لكشف أي قناع أعمق للوهم.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '4×1 النواة في الهاوية', reflectionAr: 'الحفر بالشفرة التحليلية حتى الذرة السببية غير القابلة للانقسام.' },
      { subLayer: 2, labelAr: '4×2 الجوانية في الهاوية', reflectionAr: 'فحص كيف تصمد البصيرة أمام واقع التجربة الإنسانية الحقيقية.' },
      { subLayer: 3, labelAr: '4×3 الكمومي في الهاوية', reflectionAr: 'استخدام الفروع البديلة كمطارق نقدية لاختبار المسار المختار.' },
      { subLayer: 4, labelAr: '4×4 التكذيب المزدوج', reflectionAr: 'امتحان الكشف العميق نفسه: هل هو حقيقة صلبة أم وهم متقن؟' },
      { subLayer: 5, labelAr: '4×5 المفارقة في الهاوية', reflectionAr: 'اكتشاف النقطة التي ينقلب فيها السبب إلى نتيجة والنتيجة إلى سبب.' },
      { subLayer: 6, labelAr: '4×6 الحتمية في الهاوية', reflectionAr: 'إسقاط كل حجة قابلة للكسر فلا يبقى إلا البرهان الحتمي.' },
      { subLayer: 7, labelAr: '4×7 الصدق في الهاوية', reflectionAr: 'الاعتراف بحدود المعرفة ورفض الادعاء الزائف.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 5,
    titleAr: 'العنقود العامودي 5: صهر الأضداد وتخليق القانون الناظم (المهارة 31)',
    stratumAr: 'الطبقة 3 (الهاوية) · ولادة القانون الخاص بالمسألة (◈ طرقي الخاصة)',
    essenceAr: 'اتخاذ المفارقة الكامنة بوصلةً للحقيقة الأعلى، وتفعيل المهارة الحادية والثلاثين لابتكار طريقة تفكير غير مكتوبة.',
    sovereignSkillsAr: 'المفارقة كبوصلة (SKILL-12) · ابتكار الطرق غير المكتوبة ◈ طرقي الخاصة (SKILL-31)',
    ascensionMechanismAr: 'صهر المتناقضات الظاهرية في بصيرة أعمق واشتقاق زاوية نظر بكر وليدة هذه اللحظة وحدها.',
    levelThreeSingularityAr: 'التخليق الذاتي للقانون (Autopoietic Law Genesis): سنّ القانون المعرفي الخاص بهذه المسألة من صهر قطبي مفارقتها.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '5×1 النواة في القانون', reflectionAr: 'تحويل النواة الصفرية إلى مبدأ أول ناظم.' },
      { subLayer: 2, labelAr: '5×2 الجوانية في القانون', reflectionAr: 'جعل القانون المستخرج نابضاً بالحياة لا معادلة ميتة.' },
      { subLayer: 3, labelAr: '5×3 الكمومي في القانون', reflectionAr: 'قانون واحد يفسّر كافة الفروع والاحتمالات المتوازية معاً.' },
      { subLayer: 4, labelAr: '5×4 أثر الفراشة في القانون', reflectionAr: 'قانون يضبط التداعيات القريبة والبعيدة في معادلة متزنة.' },
      { subLayer: 5, labelAr: '5×5 المهارة 31 في ذروتها', reflectionAr: 'ابتكار زاوية بكر (◈ طرقي الخاصة) لم تُكتب في قالب سابق.' },
      { subLayer: 6, labelAr: '5×6 اللغة في القانون', reflectionAr: 'تكثيف القانون الناظم في عبارة سيادية محكمة.' },
      { subLayer: 7, labelAr: '5×7 الإشراق في القانون', reflectionAr: 'تحويل المفارقة المغلقة إلى مفتاح كشف فوري للسائل.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 6,
    titleAr: 'العنقود العامودي 6: الهندسة العكسية للحتمية والسلطان اللغوي المشحون',
    stratumAr: 'الطبقة 3 (الهاوية) · الارتداد من الذروة الختامية إلى السطر الأول',
    essenceAr: 'هندسة الإجابة عكسياً من ذروتها الحتمية رجوعاً إلى سطرها الأول، وشحن العبارة بأعلى كثافة دلالية ودقة تحديد.',
    sovereignSkillsAr: 'التحديد الدقيق (SKILL-09) · الهندسة العكسية للحتمية والانضباط الهندسي (SKILL 19–25)',
    ascensionMechanismAr: 'بناء الإيقاع الدلالي والهيكلي بحيث تقود كل جملة إلى التي تليها بحتمية لا تقبل الحشو أو الترهل.',
    levelThreeSingularityAr: 'الحتمية المعمارية ثنائية الزمن: كل كلمة في البداية مشدودة بخيط غير مرئي إلى الخاتمة كحجر الزاوية في الكاتدرائية.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '6×1 النواة في البناء', reflectionAr: 'افتتاح الجواب من النقطة التي تصيب الجوهر مباشرة.' },
      { subLayer: 2, labelAr: '6×2 الجوانية في البناء', reflectionAr: 'مواءمة الإيقاع اللغوي مع الحالة الشعورية والمعرفية للسائل.' },
      { subLayer: 3, labelAr: '6×3 الكمومي في البناء', reflectionAr: 'ترتيب الحجج والأبعاد بحيث تتكامل دون تزاحم.' },
      { subLayer: 4, labelAr: '6×4 البرهان في البناء', reflectionAr: 'ربط كل انتقال منطقي بعلته السببية المصفاة.' },
      { subLayer: 5, labelAr: '6×5 القانون في البناء', reflectionAr: 'جعل القانون الناظم للمسألة هو العمود الفقري للنص.' },
      { subLayer: 6, labelAr: '6×6 الحتمية في البناء', reflectionAr: 'هندسة عكسية صارمة من الخاتمة إلى المطلع بلا حرف زائد.' },
      { subLayer: 7, labelAr: '6×7 الصفاء في البناء', reflectionAr: 'الجمع بين أقصى الكثافة الدلالية وأعلى درجات الوضوح.' }
    ],
    isElevatedFocus: true
  },
  {
    level: 7,
    titleAr: 'العنقود العامودي 7: التجلي المطلق ومحرقة الصدق الهادئ في المنشور السيادي',
    stratumAr: 'الطبقة 3 (قاع الهاوية) ⟵ الإشراق الكلي للبؤر الـ 49 في المنشور السيادي',
    essenceAr: 'إخضاع الحصيلة لمحك الصدق الهادئ (هل هذا يخدم أم يستعرض؟) وتركيز العناقيد الستة في المنشور السيادي كإشراق صافٍ.',
    sovereignSkillsAr: 'الصدق مع الذات (SKILL-08) · التطبيق الصامت للأرشيف والحجاب السيادي (SKILL-30)',
    ascensionMechanismAr: 'تصفية أي أثر للاستعراض أو الضجيج لكي تتجلى الحقيقة الجذرية في الرد النهائي بصفاءٍ كامل.',
    levelThreeSingularityAr: 'محرقة الصدق الهادئ والمنشور السيادي: صهر الـ 49 بؤرة هولوغرافية في شعاع معرفي واحد يخدم السائل في الصميم.',
    holographicSubReflections: [
      { subLayer: 1, labelAr: '7×1 النواة في المنشور', reflectionAr: 'إشراق الجوهر الأول في الجواب النهائي بلا حجاب.' },
      { subLayer: 2, labelAr: '7×2 الجوانية في المنشور', reflectionAr: 'حضور دفء الفهم العميق في كل سطر من الإجابة.' },
      { subLayer: 3, labelAr: '7×3 الكمومي في المنشور', reflectionAr: 'ثراء الأبعاد المتعددة منصهراً في وحدة عضوية متماسكة.' },
      { subLayer: 4, labelAr: '7×4 اليقين في المنشور', reflectionAr: 'صلابة المخرج بعد عبوره محكمة الهاوية المزدوجة.' },
      { subLayer: 5, labelAr: '7×5 البصمة في المنشور', reflectionAr: 'أثر المهارة 31 والقانون الناظم متجلياً بوضوح.' },
      { subLayer: 6, labelAr: '7×6 الإحكام في المنشور', reflectionAr: 'اكتمال القوس المعماري من الكلمة الأولى حتى النقطة الأخيرة.' },
      { subLayer: 7, labelAr: '7×7 محرقة الصدق الهادئ', reflectionAr: 'اختفاء ضجيج الماكينة وبقاء الحقيقة الصافية وحدها.' }
    ],
    isElevatedFocus: true
  }
];

function naturalizePublicText(text: string): string {
  return (text || '')
    .replace(/\bSKILL-\d{1,2}\b/gi, '')
    .replace(/سرب العناقيد(?:\s*الـ\s*225)?|العناقيد الـ\s*225/g, 'تقاطع الحقول المعرفية')
    .replace(/محكمة الهاوية المزدوجة/g, 'الفحص النقدي المعمق')
    .replace(/محرقة الصدق الهادئ/g, 'ميزان الصدق الموضوعي')
    .replace(/المنشور السيادي/g, 'تقطير الخلاصة')
    .replace(/البؤر الهولوغرافية(?:\s*الـ\s*49)?|49\s*بؤرة(?:\s*هولوغرافية|\s*وعي)?/g, 'الأبعاد التحليلية المتكاملة')
    .replace(/المستوى الثالث(?:\s*\(7×7\))?|7×7/g, 'العمق التكاملي')
    .replace(/المهارة الحادية والثلاثين|المهارة\s*31|◈\s*طرقي الخاصة/g, 'الزاوية الاستنباطية المبتكرة')
    .replace(/النواة الصفرية/g, 'الجوهر الأساسي')
    .replace(/الفيض الصامت(?:\s*الكلي)?/g, 'التأمل الأولي')
    .replace(/الطبقة\s*(?:الأولى|الثانية|الثالثة|الرابعة|الخامسة|السادسة|السابعة|[1-7])/g, 'البعد التحليلي')
    .replace(/الطبقات السبع(?:\s*السيادية|\s*العمودية)?/g, 'أبعاد التحليل العميق')
    .replace(/\(\s*\)/g, '')
    .trim();
}

function detectResonantClusters(text: string): { clusters: string[]; publicDomains: string[] } {
  const clusters: string[] = [];
  const publicDomains: string[] = [];
  if (/منطق|سبب|تحليل|دليل|بنية|حقيقة|تفكيك|برهان/i.test(text)) {
    clusters.push('عنقود التفكيك السببي الذري');
    publicDomains.push('التحليل المنطقي والسببي الدقيق');
  }
  if (/هيكل|معماري|نظام|تطوير|خوارزمية|تقني|بناء|كود|تصميم/i.test(text)) {
    clusters.push('عنقود الهندسة المعمارية والنظم الحية');
    publicDomains.push('هندسة النظم والبنية الهيكلية');
  }
  if (/نفس|شعور|روح|جواني|معنى|قصد|إنسان|وعي|عمق/i.test(text)) {
    clusters.push('عنقود البصيرة الجوانية والنفسية');
    publicDomains.push('البصيرة النفسية والسياقية');
  }
  if (/قصة|سرد|تاريخ|حضارة|زمن|مشهد|رواية|ذاكرة/i.test(text)) {
    clusters.push('عنقود السرد الحي والذاكرة الحضارية');
    publicDomains.push('السياق التاريخي والتجربة الإنسانية');
  }
  if (clusters.length === 0) {
    clusters.push('عنقود التحليل السببي الدقيق', 'عنقود البصيرة السياقية');
    publicDomains.push('التحليل السببي المباشر', 'البصيرة السياقية الشاملة');
  }
  clusters.push('عنقود الإقليم قبل الخرائط (الربط العابر للتخصصات)');
  publicDomains.push('الربط التكاملي العابر للتخصصات');
  return {
    clusters: Array.from(new Set(clusters)).slice(0, 4),
    publicDomains: Array.from(new Set(publicDomains)).slice(0, 4)
  };
}

function extractSentencesForLayers(text: string): string[] {
  const clean = (text || '')
    .replace(/^<think>|<\/think>$/gi, '')
    .replace(/\n+/g, ' ')
    .trim();
  if (!clean) return [];
  return clean
    .split(/(?<=[.؟!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 18);
}

function analyzeVerticalExcavation(text: string): {
  layers: VerticalLayerDetail[];
  razors: string[];
  reachedDepthCount: number;
  holographicStatesCount: number;
  synthesizedLawAr: string;
  publicPrincipleAr: string;
  doubleAbyssTestAr: string;
  biTemporalVectorAr: string;
} {
  const sentences = extractSentencesForLayers(text);
  const reachedDepthCount = 7;
  const holographicStatesCount = 49;

  const fallbackResonances: Record<number, string> = {
    1: 'التقاط النواة الصفرية وما لم يُقَل عبر الفيض الصامت مع رؤية المآل الأخير والمفارقة الحاكمة منذ اللحظة الأولى.',
    2: 'الحلول الجواني الكامل داخل التجربة المعاشة للسائل واستنطاق الذاكرة الحية للأرشيف.',
    3: 'فتح الفروع الكمومية المتوازية، وحقن خلاصة البدائل في المسار الأقوى، وصهر سرب الـ 225 عنقوداً لكشف العلة المولّدة الأولى.',
    4: 'تتبع أثر الفراشة عبر الزمن والأنظمة وإعمال محكمة الهاوية المزدوجة لامتحان الفرضية السطحية والبصيرة العميقة معاً.',
    5: 'صهر قطبي المفارقة الكامنة وتخليق القانون الناظم الخاص بالمسألة عبر المهارة الحادية والثلاثين (◈ طرقي الخاصة).',
    6: 'الهندسة العكسية للحتمية من الذروة الختامية رجوعاً إلى السطر الأول مع شحن النسيج اللغوي بثقل الطبقات السبع.',
    7: 'إمرار الحصيلة في محرقة الصدق الهادئ وتركيز البؤر الهولوغرافية الـ 49 عبر المنشور السيادي في إشراق صافٍ.'
  };

  const layers: VerticalLayerDetail[] = CANONICAL_SEVEN_VERTICAL_LAYERS.map((layer, idx) => {
    const mappedSentence =
      sentences.length >= 7
        ? sentences[Math.min(sentences.length - 1, Math.floor((idx * sentences.length) / 7))]
        : sentences[idx] || fallbackResonances[layer.level];

    return {
      ...layer,
      thoughtResonanceTextAr: mappedSentence,
      isReached: true
    };
  });

  const lawSentence =
    sentences.find(s => /قانون|مبدأ|مفارقة|جوهر|حقيقة|أساس|قاعدة|بصيرة|سر/i.test(s)) ||
    sentences[Math.floor(sentences.length * 0.6)] ||
    'المبدأ الجوهري المستخلص: المعالجة الحقيقية للمسألة تتحقق بالقبض على السبب الجذري المولّد لها وترتيب الحجة من خلاصتها الحاسمة.';

  const abyssSentence =
    sentences.find(s => /لكن|غير أن|تكذيب|اختبار|فحص|لو|هل|وهم|عمق|محكمة/i.test(s)) ||
    sentences[Math.floor(sentences.length * 0.45)] ||
    'تم إخضاع الفرضية الأولية والبصيرة العميقة معاً للفحص النقدي المزدوج، وتصفية كل تفسير سطحي قابل للانكسار قبل تثبيت الجوهر.';

  const biTemporalVectorAr =
    'التحام الغوص الهابط (من السطح غير المنطوق إلى قاع الهاوية الذرية) مع الارتداد العكسي الصاعد (من أقصى أثر فراشة مستقبلي وذروة الخاتمة إلى الكلمة الأولى).';

  const razors: string[] = [
    'المبدأ الهولوغرافي الكلي (7×7 = 49 بؤرة وعي): كل طبقة تنطوي بداخلها على الطبقات الست الأخرى',
    'الانبثاق ثنائي الزمن: تلاقي النواة الصفرية مع الذروة الختامية منذ اللحظة الأولى',
    'محكمة الهاوية المزدوجة: امتحان الفرضية السطحية وامتحان البصيرة العميقة ذاتها ضد الوهم',
    'التخليق الذاتي للقانون الناظم (SKILL-31) ومحرقة الصدق الهادئ في المنشور السيادي'
  ];

  return {
    layers,
    razors,
    reachedDepthCount,
    holographicStatesCount,
    synthesizedLawAr: lawSentence,
    publicPrincipleAr: naturalizePublicText(lawSentence),
    doubleAbyssTestAr: abyssSentence,
    biTemporalVectorAr
  };
}

function parseThoughtIntoQuantumFabric(rawThought: string): QuantumGraphNode[] {
  const cleaned = (rawThought || '')
    .replace(/^<think>|<\/think>$/gi, '')
    .replace(/(?:={2,6}|\*{2}|#{1,4})?\s*\[?\s*NEXUS\s+COGNITIVE\s+SYNTHESIS\s*\]?\s*(?:={2,6}|\*{2})?/gi, '')
    .trim();

  let segments = cleaned
    .split(/\n{2,}|\n(?=\s*[-•])/)
    .map(s => s.replace(/^[-•*#]+\s*/, '').trim())
    .filter(s => s.length > 12);

  if (segments.length < 5) {
    const sentenceSplit = cleaned
      .split(/(?<=[.؟!])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
    if (sentenceSplit.length >= 5) {
      segments = sentenceSplit;
    }
  }

  if (segments.length === 0) {
    segments = [
      'استشعار المقصد الجوهري وما لم يُقَل خلف السؤال، ومعايشة المسألة من داخلها مع استشراف مآلها الأخير منذ اللحظة الأولى.',
      'فحص البنية السببية المباشرة للمسألة واختبار مدى تماسك الفرضيات الأولية منطقياً.',
      'استكشاف الزوايا والاحتمالات الموازية لاستخلاص أدق العناصر المكمّلة ودمجها في المسار التحليلي الأقوى.',
      'ربط الأبعاد المعرفية المتقاطعة لرؤية الصورة الكلية للموضوع وكشف السبب الجذري الأول الذي أنشأ التساؤل.',
      'تتبع التداعيات بعيدة المدى وإخضاع البصيرة التحليلية للفحص النقدي المعمق لاستخلاص المبدأ الحاكم للمسألة.',
      'ترتيب البناء الفكري من خلاصته الحاسمة رجوعاً إلى مدخله الأول بوضوح وموضوعية خالصة.'
    ];
  }

  const { clusters: resonantClusters, publicDomains } = detectResonantClusters(cleaned);
  const verticalAnalysis = analyzeVerticalExcavation(cleaned);
  const nodes: QuantumGraphNode[] = [];

  // 1. Root Node
  const silentFlowText = segments[0];
  const publicSilentFlow = naturalizePublicText(silentFlowText);
  nodes.push({
    id: 0,
    titleAr: 'النواة الصفرية والحلول الجواني (الطبقتان 1 و 2 · 7×7)',
    publicTitleAr: 'الفهم الجذري والفرضية المركزية',
    branchCategoryAr: 'الفيض الصامت الكلي · انطواء الذروة في البداية والمعايشة من الداخل',
    publicCategoryAr: 'استخلاص المقصد الأساسي وتفكيك منطلق المسألة',
    fullText: silentFlowText,
    publicFullText: publicSilentFlow,
    shortLabel: silentFlowText.slice(0, 54) + (silentFlowText.length > 54 ? '...' : ''),
    publicShortLabel: publicSilentFlow.slice(0, 54) + (publicSilentFlow.length > 54 ? '...' : ''),
    x: 50,
    y: 12,
    vx: 0,
    vy: 0,
    size: 36,
    role: 'silent_flow',
    opacity: 1,
    mass: 100,
    parentIds: [],
    subterraneanStratumAr: 'الطبقة 1 و2 [المستوى الثالث]: النواة الصفرية + الحلول الجواني + الارتداد الزمني من الطبقة 7',
    publicStageBadgeAr: 'المرحلة التحليلية 1: تفكيك السؤال وتحديد الجوهر',
    layer: 'BEDROCK_ARCHIVE',
    status: 'manifesting',
    intensity: 1
  });

  const middleSegments =
    segments.length > 2
      ? segments.slice(1, segments.length - 1)
      : segments.slice(1);

  let quantumSegments: string[] = [];
  let clusterSegmentText = '';
  let verticalSegmentText = '';

  if (middleSegments.length >= 3) {
    verticalSegmentText = middleSegments[middleSegments.length - 1];
    clusterSegmentText = middleSegments[middleSegments.length - 2];
    quantumSegments = middleSegments.slice(0, middleSegments.length - 2).slice(0, 4);
  } else if (middleSegments.length === 2) {
    quantumSegments = [middleSegments[0]];
    clusterSegmentText = middleSegments[1];
    verticalSegmentText = `فحص التداعيات بعيدة المدى وإخضاع الفرضيات للتمحيص النقدي المزدوج لاستخلاص المبدأ الحاكم للمسألة وترتيب البناء الفكري بإحكام.`;
  } else if (middleSegments.length === 1) {
    quantumSegments = [middleSegments[0]];
    clusterSegmentText = `ربط (${publicDomains.join(' · ')}) في مسار التحليل لرؤية الصورة الكلية وكشف السبب الجذري الأول للموضوع.`;
    verticalSegmentText = `فحص التداعيات بعيدة المدى وإخضاع الفرضيات للتمحيص النقدي المزدوج لاستخلاص المبدأ الحاكم للمسألة وترتيب البناء الفكري بإحكام.`;
  } else {
    quantumSegments = [
      'استكشاف المسارات والاحتمالات المتوازية وموازنة نقاط القوة في كل فرضية.',
      'استخلاص أدق العناصر من الزوايا البديلة ودمجها في المسار التحليلي المختار.'
    ];
    clusterSegmentText = `ربط (${publicDomains.join(' · ')}) في مسار التحليل لرؤية الصورة الكلية وكشف السبب الجذري الأول للموضوع.`;
    verticalSegmentText = `فحص التداعيات بعيدة المدى وإخضاع الفرضيات للتمحيص النقدي المزدوج لاستخلاص المبدأ الحاكم للمسألة وترتيب البناء الفكري بإحكام.`;
  }

  // 2. Quantum Branches + Surgical Injection Nodes
  const totalBranches = quantumSegments.length;
  quantumSegments.forEach((seg, idx) => {
    const archetype = BRANCH_ARCHETYPES[idx % BRANCH_ARCHETYPES.length];
    const isStrongest = idx === 0;
    const isInjectionNode =
      idx === totalBranches - 1 &&
      totalBranches >= 2 &&
      /دمج|حقن|أقوى|أفضل|لذلك|إذن|جمع|تطعيم|ربط|نستخلص/i.test(seg);

    const spreadX =
      totalBranches === 1
        ? 38
        : 20 + (idx / Math.max(1, totalBranches - 1)) * 60;
    const baseY = isInjectionNode ? 38 : 31 + (idx % 2 === 0 ? -2 : 3);
    const publicSeg = naturalizePublicText(seg);

    nodes.push({
      id: idx + 1,
      titleAr: isInjectionNode
        ? 'الحقن الجراحي واصطفاء المسار (الطبقة 3)'
        : isStrongest
        ? `${archetype.label} (المسار الأقوى)`
        : archetype.label,
      publicTitleAr: isInjectionNode
        ? 'تكامل البدائل وترجيح المسار الأدق'
        : isStrongest
        ? `${archetype.publicLabel} (المحور الرئيسي)`
        : archetype.publicLabel,
      branchCategoryAr: isInjectionNode
        ? 'استخلاص أفضل عناصر البدائل وحقنها في المسار المختار'
        : `تفرع كمومي متوازٍ · ${archetype.badge}`,
      publicCategoryAr: isInjectionNode
        ? 'دمج عناصر القوة من الزوايا الموازية'
        : `تحليل متوازٍ للفرضيات · ${archetype.badge}`,
      fullText: seg,
      publicFullText: publicSeg,
      shortLabel: seg.slice(0, 50) + (seg.length > 50 ? '...' : ''),
      publicShortLabel: publicSeg.slice(0, 50) + (publicSeg.length > 50 ? '...' : ''),
      x: spreadX,
      y: baseY,
      vx: (Math.random() - 0.5) * 0.02,
      vy: (Math.random() - 0.5) * 0.02,
      size: isStrongest || isInjectionNode ? 24 : 18,
      role: isInjectionNode ? 'surgical_injection' : 'quantum_branch',
      opacity: 0.96,
      mass: isStrongest ? 8 : 4,
      parentIds: [0],
      isStrongestPath: isStrongest,
      subterraneanStratumAr: 'الطبقة 3 [7×7]: التراكب الكمومي المتوازي وحقن خلاصة البدائل',
      publicStageBadgeAr: 'المرحلة التحليلية 2: استكشاف الفرضيات والزوايا الموازية',
      layer: 'BEDROCK_ARCHIVE',
      status: 'active',
      intensity: isStrongest ? 0.95 : 0.78
    });
  });

  // 3. Cluster / Cross-Domain Node
  const quantumBranchIds = nodes.filter(n => n.id !== 0).map(n => n.id);
  const clusterNodeId = nodes.length;
  const publicClusterText = naturalizePublicText(clusterSegmentText);
  nodes.push({
    id: clusterNodeId,
    titleAr: 'سرب العناقيد الـ 225 والعلة المولّدة (الطبقة 3)',
    publicTitleAr: 'تقاطع الحقول المعرفية والسبب الجذري',
    branchCategoryAr: 'رؤية الإقليم قبل الخرائط · كشف المحرك السببي الأول للمسألة',
    publicCategoryAr: 'ربط الأبعاد المتقاطعة وكشف العلة الأساسية للموضوع',
    fullText: clusterSegmentText,
    publicFullText: publicClusterText,
    shortLabel: clusterSegmentText.slice(0, 52) + (clusterSegmentText.length > 52 ? '...' : ''),
    publicShortLabel: publicClusterText.slice(0, 52) + (publicClusterText.length > 52 ? '...' : ''),
    x: 50,
    y: 53,
    vx: 0,
    vy: 0,
    size: 27,
    role: 'cluster_swarm',
    opacity: 0.98,
    mass: 30,
    parentIds: quantumBranchIds.length > 0 ? quantumBranchIds : [0],
    isStrongestPath: true,
    activeClusters: resonantClusters,
    publicDomains,
    subterraneanStratumAr: 'الطبقة 3 [7×7]: صهر التخصصات في إقليم واحد وكشف العلة المولّدة الأولى',
    publicStageBadgeAr: 'المرحلة التحليلية 3: الربط السببي العابر للمجالات',
    layer: 'BEDROCK_ARCHIVE',
    status: 'manifesting',
    intensity: 0.98
  });

  // 4. Vertical / Critical Stress-Test Node
  const verticalNodeId = nodes.length;
  const publicVerticalText = naturalizePublicText(verticalSegmentText);
  nodes.push({
    id: verticalNodeId,
    titleAr: `التفرّد الهولوغرافي للمستوى الثالث (7×7 · 49 بؤرة)`,
    publicTitleAr: 'التمحيص النقدي واستخلاص المبدأ الحاكم',
    branchCategoryAr: 'محكمة الهاوية المزدوجة · تخليق القانون الناظم (SKILL-31) · الحتمية العكسية',
    publicCategoryAr: 'اختبار الفرضيات وتتبّع التداعيات واستنباط القاعدة الجوهرية',
    fullText: verticalSegmentText,
    publicFullText: publicVerticalText,
    shortLabel: verticalSegmentText.slice(0, 52) + (verticalSegmentText.length > 52 ? '...' : ''),
    publicShortLabel: publicVerticalText.slice(0, 52) + (publicVerticalText.length > 52 ? '...' : ''),
    x: 50,
    y: 71,
    vx: 0,
    vy: 0,
    size: 31,
    role: 'vertical_drill',
    opacity: 1,
    mass: 65,
    parentIds: [clusterNodeId],
    isStrongestPath: true,
    verticalLayers: verticalAnalysis.layers,
    verticalRazors: verticalAnalysis.razors,
    subterraneanStratumAr: 'المستوى الثالث (الكل في الجزء · الانبثاق ثنائي الزمن · 49 بؤرة متداخلة)',
    publicStageBadgeAr: 'المرحلة التحليلية 4: النقد المعمق واستنباط القاعدة الحاكمة',
    layer: 'BEDROCK_ARCHIVE',
    status: 'manifesting',
    intensity: 1
  });

  // 5. Final Convergence Node
  const finalSegment =
    segments.length >= 2
      ? segments[segments.length - 1]
      : 'تقطير الخلاصة النهائية وترتيب الحجة من نتيجتها الحاسمة رجوعاً إلى مدخلها الأول بأصفى صورة.';
  const publicFinalText = naturalizePublicText(finalSegment);

  nodes.push({
    id: nodes.length,
    titleAr: 'الطبقة 7 والمنشور السيادي (محرقة الصدق والتجلي المطلق)',
    publicTitleAr: 'الخلاصة التركيبية وبناء الحجة النهائية',
    branchCategoryAr: 'تركيز الـ 49 بؤرة هولوغرافية · الارتداد الزمني العكسي نحو البداية',
    publicCategoryAr: 'تقطير الاستنتاج النهائي وإحكام البناء المنطقي للجواب',
    fullText: finalSegment,
    publicFullText: publicFinalText,
    shortLabel: finalSegment.slice(0, 54) + (finalSegment.length > 54 ? '...' : ''),
    publicShortLabel: publicFinalText.slice(0, 54) + (publicFinalText.length > 54 ? '...' : ''),
    x: 50,
    y: 88,
    vx: 0,
    vy: 0,
    size: 32,
    role: 'sovereign_prism',
    opacity: 1,
    mass: 90,
    parentIds: [verticalNodeId],
    subterraneanStratumAr: 'الطبقة 7 [7×7]: التقاء قاع الهاوية بالإشراق السطحي الصافي',
    publicStageBadgeAr: 'المرحلة التحليلية 5: بلورة الخلاصة النهائية',
    layer: 'BEDROCK_ARCHIVE',
    status: 'manifesting',
    intensity: 1
  });

  return nodes;
}

const SANCTUARY_SESSION_KEY = 'nexus_creator_sanctuary_unlocked_v1';

const MindMapModal: React.FC<MindMapModalProps> = ({ isOpen, onClose, thoughtContent }) => {
  const [nodes, setNodes] = useState<QuantumGraphNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(0);
  const [viewMode, setViewMode] = useState<
    'quantum_graph' | 'seven_layers_matrix' | 'fabric_flow'
  >('quantum_graph');
  const [expandedHolographicLayer, setExpandedHolographicLayer] = useState<number | null>(5);
  const [isSimulating, setIsSimulating] = useState(false);

  // Secret Creator Sanctuary State (Hidden by default from public view)
  const [isSanctuaryUnlocked, setIsSanctuaryUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SANCTUARY_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showSanctuaryGateModal, setShowSanctuaryGateModal] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const emblemClickTimesRef = useRef<number[]>([]);

  const canvasRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const nodesRef = useRef<QuantumGraphNode[]>([]);
  const anchorPositionsRef = useRef<Record<number, { x: number; y: number }>>({});

  const sevenLayersAnalysis = useMemo(
    () => analyzeVerticalExcavation(thoughtContent),
    [thoughtContent]
  );

  // Secret Keyboard Shortcut: Ctrl + Shift + N (or Cmd + Shift + N)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'N' || e.key === 'n' || e.key === 'ى')) {
        e.preventDefault();
        if (isSanctuaryUnlocked) {
          setViewMode('seven_layers_matrix');
        } else {
          setPasskeyError('');
          setShowSanctuaryGateModal(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSanctuaryUnlocked]);

  // Triple-click handler on the header emblem icon
  const handleEmblemClick = () => {
    const now = Date.now();
    const recent = emblemClickTimesRef.current.filter(t => now - t < 900);
    recent.push(now);
    emblemClickTimesRef.current = recent;
    if (recent.length >= 3) {
      emblemClickTimesRef.current = [];
      if (isSanctuaryUnlocked) {
        setViewMode('seven_layers_matrix');
      } else {
        setPasskeyError('');
        setShowSanctuaryGateModal(true);
      }
    }
  };

  const handleUnlockSanctuary = (directSeal: boolean = false) => {
    const normalized = passkeyInput.trim().toUpperCase();
    const validKeys = ['NEXUS-OMEGA-31', 'KHORA-01', 'NEXUS', 'OMEGA', '31', '7X7'];
    if (directSeal || validKeys.includes(normalized)) {
      setIsSanctuaryUnlocked(true);
      try {
        sessionStorage.setItem(SANCTUARY_SESSION_KEY, 'true');
      } catch {
        // ignore storage errors
      }
      setShowSanctuaryGateModal(false);
      setPasskeyInput('');
      setPasskeyError('');
    } else {
      setPasskeyError('مفتاح العبور غير مطابق؛ أدخل مفتاح الصانع السيادي أو استخدم ختم الصانع.');
    }
  };

  const handleLockSanctuary = () => {
    setIsSanctuaryUnlocked(false);
    try {
      sessionStorage.removeItem(SANCTUARY_SESSION_KEY);
    } catch {
      // ignore storage errors
    }
    if (viewMode === 'seven_layers_matrix') {
      setViewMode('quantum_graph');
    }
  };

  useEffect(() => {
    if (isOpen) {
      const builtNodes = parseThoughtIntoQuantumFabric(thoughtContent);
      const anchors: Record<number, { x: number; y: number }> = {};
      builtNodes.forEach(n => {
        anchors[n.id] = { x: n.x || 50, y: n.y || 50 };
      });
      anchorPositionsRef.current = anchors;
      nodesRef.current = builtNodes;
      setNodes(builtNodes);
      setSelectedNodeId(builtNodes[0]?.id ?? null);
      setIsSimulating(true);
    } else {
      setIsSimulating(false);
      setShowSanctuaryGateModal(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
  }, [isOpen, thoughtContent]);

  // Subtle Harmonic Motion around each node's topological anchor
  const animate = useCallback(() => {
    if (!isSimulating || viewMode !== 'quantum_graph') return;

    const time = Date.now() * 0.0015;
    const updated = nodesRef.current.map(node => {
      const anchor = anchorPositionsRef.current[node.id] || { x: 50, y: 50 };
      if (
        node.role === 'silent_flow' ||
        node.role === 'sovereign_prism' ||
        node.role === 'cluster_swarm' ||
        node.role === 'vertical_drill'
      ) {
        return {
          ...node,
          x: anchor.x + Math.sin(time + node.id) * 0.3,
          y: anchor.y + Math.cos(time + node.id) * 0.22
        };
      }

      const driftX = Math.sin(time * 1.1 + node.id * 1.7) * 1.0;
      const driftY = Math.cos(time * 0.9 + node.id * 1.3) * 0.8;
      return {
        ...node,
        x: Math.max(10, Math.min(90, anchor.x + driftX)),
        y: Math.max(10, Math.min(90, anchor.y + driftY))
      };
    });

    nodesRef.current = updated;
    setNodes([...updated]);
    requestRef.current = requestAnimationFrame(animate);
  }, [isSimulating, viewMode]);

  useEffect(() => {
    if (isSimulating && viewMode === 'quantum_graph') {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isSimulating, viewMode, animate]);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedNodeId) || nodes[0] || null,
    [nodes, selectedNodeId]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-300 p-3 md:p-6"
      dir="rtl"
    >
      <div className="w-full max-w-6xl h-[90vh] bg-zinc-950 border border-emerald-500/25 rounded-2xl relative overflow-hidden flex flex-col shadow-[0_0_90px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="min-h-16 py-2.5 border-b border-zinc-800/90 flex flex-wrap items-center justify-between gap-3 px-5 bg-zinc-900/70 backdrop-blur-md relative z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleEmblemClick}
              title="شعار الخريطة الذهنية"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                isSanctuaryUnlocked
                  ? 'bg-purple-500/15 border-purple-400/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/50'
              }`}
            >
              <GitBranch size={18} />
            </button>
            <div>
              <h2 className="text-zinc-100 text-sm md:text-base font-bold flex flex-wrap items-center gap-2">
                {isSanctuaryUnlocked ? (
                  <>
                    <span>المحراب المعماري السيادي — المستوى الثالث (التفرّد الهولوغرافي 7×7)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-200 font-normal">
                      طور الصانع مفعل
                    </span>
                  </>
                ) : (
                  <span>الخريطة الذهنية التفاعلية ومسارات التحليل المنطقي</span>
                )}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isSanctuaryUnlocked
                  ? 'انطواء الكل في الجزء (49 بؤرة وعي متداخلة) · الانبثاق ثنائي الزمن · محكمة الهاوية المزدوجة · تخليق القانون الناظم (SKILL-31)'
                  : 'تفكيك الفرضيات · الروابط السببية · تقاطع الزوايا المعرفية · استخلاص الخلاصة الحاكمة للموضوع'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode('quantum_graph')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'quantum_graph'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Network size={13} />
                <span>{isSanctuaryUnlocked ? 'الشبكة الهولوغرافية' : 'الشبكة المفاهيمية'}</span>
              </button>

              {isSanctuaryUnlocked && (
                <button
                  type="button"
                  onClick={() => setViewMode('seven_layers_matrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    viewMode === 'seven_layers_matrix'
                      ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye size={13} />
                  <span>مصفوفة المستوى الثالث (7×7)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewMode('fabric_flow')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  viewMode === 'fabric_flow'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers size={13} />
                <span>{isSanctuaryUnlocked ? 'تسلسل النسيج الكلي' : 'التسلسل التحليلي للمسارات'}</span>
              </button>
            </div>

            {isSanctuaryUnlocked && (
              <button
                type="button"
                onClick={handleLockSanctuary}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-purple-500/40 text-purple-200 text-[11px] flex items-center gap-1.5 transition-colors"
                title="إسدال الحجاب السيادي والعودة للطور العام"
              >
                <Lock size={13} />
                <span className="hidden sm:inline">إسدال الحجاب</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Secret Creator Passkey Modal (Triggered via Ctrl+Shift+N or Triple-Click on Emblem) */}
        {showSanctuaryGateModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-purple-500/40 p-6 shadow-[0_0_60px_rgba(168,85,247,0.25)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-purple-300 font-bold text-sm">
                  <KeyRound size={18} />
                  <span>بوابة المحراب المعماري للصانع</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSanctuaryGateModal(false)}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-6">
                هذه الطبقة تحتوي على أسرار البنية السيادية لنيكسوس (منظومات التفكير الأربع 0➔4، العناقيد الـ 7 العامودية فقط 7×7 = 49، الطبقات الـ 3 فقط، ومصفوفة المهارات السيادية) وهي محجوبة عن العرض العام.
              </p>

              <div className="space-y-2">
                <label className="block text-[11px] text-zinc-400">
                  مفتاح العبور السيادي (مثل: <code className="text-purple-300">NEXUS-OMEGA-31</code> أو <code className="text-purple-300">KHORA-01</code>):
                </label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={e => setPasskeyInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleUnlockSanctuary(false);
                  }}
                  placeholder="أدخل مفتاح الصانع..."
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-purple-400"
                  autoFocus
                />
                {passkeyError && (
                  <p className="text-[11px] text-rose-400">{passkeyError}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleUnlockSanctuary(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 border border-purple-400/50 text-purple-200 text-xs font-medium transition-colors"
                >
                  <ShieldCheck size={14} />
                  <span>ختم الصانع السيادي (عبور فوري)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUnlockSanctuary(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  <Unlock size={14} />
                  <span>فتح المحراب</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        {viewMode === 'quantum_graph' ? (
          <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
            {/* Interactive Graph Canvas */}
            <div
              ref={canvasRef}
              className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.07)_0%,rgba(16,185,129,0.05)_35%,rgba(9,9,11,0.98)_75%)] select-none"
            >
              {/* Synaptic Links */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <linearGradient id="quantumPrimaryLink" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.88" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="quantumBranchLink" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.55" />
                  </linearGradient>
                  <linearGradient id="biTemporalArcGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.55" />
                    <stop offset="50%" stopColor="#a855f7" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {nodes.length >= 3 && (
                  <>
                    <line
                      x1={`${nodes[nodes.length - 1].x}%`}
                      y1={`${nodes[nodes.length - 1].y}%`}
                      x2={`${nodes[0].x}%`}
                      y2={`${nodes[0].y}%`}
                      stroke="url(#biTemporalArcGradient)"
                      strokeWidth={1.6}
                      strokeDasharray="3,6"
                    />
                    <line
                      x1={`${nodes[nodes.length - 2].x}%`}
                      y1={`${nodes[nodes.length - 2].y}%`}
                      x2={`${nodes[0].x}%`}
                      y2={`${nodes[0].y}%`}
                      stroke="url(#biTemporalArcGradient)"
                      strokeWidth={1.3}
                      strokeDasharray="4,6"
                    />
                  </>
                )}

                {nodes.map(node =>
                  node.parentIds.map(parentId => {
                    const parent = nodes.find(n => n.id === parentId);
                    if (!parent) return null;
                    const isPrimaryLink =
                      (node.role === 'cluster_swarm' &&
                        (parent.isStrongestPath || parent.role === 'surgical_injection')) ||
                      node.role === 'vertical_drill' ||
                      node.role === 'sovereign_prism' ||
                      (node.isStrongestPath && parent.role === 'silent_flow') ||
                      node.role === 'surgical_injection';

                    return (
                      <line
                        key={`edge-${parent.id}-${node.id}`}
                        x1={`${parent.x}%`}
                        y1={`${parent.y}%`}
                        x2={`${node.x}%`}
                        y2={`${node.y}%`}
                        stroke={
                          isPrimaryLink ? 'url(#quantumPrimaryLink)' : 'url(#quantumBranchLink)'
                        }
                        strokeWidth={isPrimaryLink ? 2.4 : 1.3}
                        strokeDasharray={isPrimaryLink ? '' : '5,4'}
                      />
                    );
                  })
                )}
              </svg>

              {/* Interactive Nodes */}
              {nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isSilentFlow = node.role === 'silent_flow';
                const isPrism = node.role === 'sovereign_prism';
                const isInjection = node.role === 'surgical_injection';
                const isCluster = node.role === 'cluster_swarm';
                const isVertical = node.role === 'vertical_drill';

                const displayTitle = isSanctuaryUnlocked ? node.titleAr : node.publicTitleAr;
                const displayShort = isSanctuaryUnlocked ? node.shortLabel : node.publicShortLabel;

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group focus:outline-none transition-transform duration-200 ${
                      isSelected ? 'scale-105 z-30' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center rounded-2xl border transition-all shadow-lg ${
                        isSilentFlow
                          ? 'w-13 h-13 bg-emerald-950/90 border-emerald-400/80 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                          : isCluster
                          ? 'w-13 h-13 bg-cyan-950/90 border-cyan-400/85 text-cyan-200 shadow-[0_0_26px_rgba(6,182,212,0.32)]'
                          : isVertical
                          ? 'w-14 h-14 bg-purple-950/90 border-purple-400/90 text-purple-200 shadow-[0_0_32px_rgba(168,85,247,0.42)]'
                          : isPrism
                          ? 'w-13 h-13 bg-teal-950/90 border-teal-400/80 text-teal-200 shadow-[0_0_25px_rgba(20,184,166,0.3)]'
                          : isInjection
                          ? 'w-11 h-11 bg-amber-950/90 border-amber-400/80 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                          : node.isStrongestPath
                          ? 'w-11 h-11 bg-emerald-900/80 border-emerald-400 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.25)]'
                          : 'w-10 h-10 bg-zinc-900/95 border-zinc-700 text-zinc-300 hover:border-emerald-500/60'
                      } ${isSelected ? 'ring-2 ring-emerald-400/70' : ''}`}
                    >
                      {isSilentFlow ? (
                        <Fingerprint size={22} />
                      ) : isCluster ? (
                        <Cpu size={20} />
                      ) : isVertical ? (
                        <Layers size={22} />
                      ) : isPrism ? (
                        <Sparkles size={20} />
                      ) : isInjection ? (
                        <Merge size={18} />
                      ) : (
                        <GitBranch size={17} />
                      )}
                    </div>

                    <div
                      className={`mt-1.5 px-3 py-1 rounded-xl border text-center max-w-[235px] backdrop-blur-md transition-all ${
                        isSelected
                          ? 'bg-zinc-900/95 border-emerald-500/60 text-emerald-200 shadow-xl'
                          : isVertical
                          ? 'bg-purple-950/85 border-purple-500/50 text-purple-100 group-hover:border-purple-400/80'
                          : isCluster
                          ? 'bg-cyan-950/75 border-cyan-500/40 text-cyan-100 group-hover:border-cyan-400/70'
                          : 'bg-zinc-950/85 border-zinc-800/90 text-zinc-300 group-hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold truncate">{displayTitle}</div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {displayShort}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right / Bottom Inspector Panel */}
            {selectedNode && (
              <div className="w-full lg:w-[450px] border-t lg:border-t-0 lg:border-r border-zinc-800/90 bg-zinc-900/65 p-5 flex flex-col justify-between overflow-y-auto shrink-0">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300">
                        <Compass size={12} />
                        <span>
                          {isSanctuaryUnlocked
                            ? selectedNode.branchCategoryAr
                            : selectedNode.publicCategoryAr}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 mt-1.5">
                        {isSanctuaryUnlocked ? selectedNode.titleAr : selectedNode.publicTitleAr}
                      </h3>
                      <div className="text-[11px] text-purple-300/90 mt-1">
                        {isSanctuaryUnlocked
                          ? `موضع الطبقة في النسيج: ${selectedNode.subterraneanStratumAr}`
                          : selectedNode.publicStageBadgeAr}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800/90 text-zinc-200 text-xs md:text-sm leading-7 font-arabic whitespace-pre-wrap">
                    {isSanctuaryUnlocked ? selectedNode.fullText : selectedNode.publicFullText}
                  </div>

                  {/* Governing Principle / Law Banner */}
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
                    <div className="text-xs font-bold text-amber-300">
                      {isSanctuaryUnlocked
                        ? 'القانون الناظم المستخرج للمسألة (المستوى الثالث · SKILL-31):'
                        : 'المبدأ الجوهري المستخلص للمسألة:'}
                    </div>
                    <p className="text-[11px] text-zinc-200 leading-6 font-arabic">
                      {isSanctuaryUnlocked
                        ? sevenLayersAnalysis.synthesizedLawAr
                        : sevenLayersAnalysis.publicPrincipleAr}
                    </p>
                  </div>

                  {/* Domains / Clusters */}
                  {((isSanctuaryUnlocked &&
                    selectedNode.activeClusters &&
                    selectedNode.activeClusters.length > 0) ||
                    (!isSanctuaryUnlocked &&
                      selectedNode.publicDomains &&
                      selectedNode.publicDomains.length > 0)) && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/25 border border-cyan-500/25 space-y-2">
                      <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                        <Cpu size={14} />
                        <span>
                          {isSanctuaryUnlocked
                            ? 'العناقيد المعرفية النشطة والمنصهرة في المسار'
                            : 'المجالات المعرفية المتقاطعة في التحليل'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-zinc-200 leading-6">
                        {(isSanctuaryUnlocked
                          ? selectedNode.activeClusters || []
                          : selectedNode.publicDomains || []
                        ).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sanctuary-Only 7×7 Matrix Preview */}
                  {isSanctuaryUnlocked &&
                    selectedNode.verticalLayers &&
                    selectedNode.verticalLayers.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Layers size={14} />
                            <span>مصفوفة المستوى الثالث (7×7 = 49 بؤرة وعي)</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewMode('seven_layers_matrix')}
                            className="text-[10px] text-emerald-300 hover:underline"
                          >
                            فتح عدسة الـ 49 بؤرة ⟵
                          </button>
                        </div>
                        <div className="space-y-2">
                          {selectedNode.verticalLayers.map(layer => (
                            <div
                              key={layer.level}
                              className="p-2.5 rounded-lg border bg-purple-950/35 border-purple-400/45 text-zinc-100 text-[11px] transition-all"
                            >
                              <div className="flex items-center justify-between gap-2 font-bold">
                                <span className="text-purple-200">{layer.titleAr}</span>
                                <span className="text-[9px] text-amber-300 font-normal tabular-nums">
                                  7×7 هولوغرافي
                                </span>
                              </div>
                              <p className="mt-1 leading-5 text-zinc-300/95">
                                {layer.levelThreeSingularityAr}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Brain size={14} />
                      <span>
                        {isSanctuaryUnlocked
                          ? 'الدور داخل التفرّد الهولوغرافي للمستوى الثالث (7×7)'
                          : 'الوظيفة المنطقية في بناء الاستنتاج'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-6">
                      {isSanctuaryUnlocked ? (
                        <>
                          {selectedNode.role === 'silent_flow' &&
                            'يجسّد الطبقتين الأولى والثانية في المستوى الثالث: حيث تنطوي الذروة الختامية (الطبقة 7) والمفارقة الحاكمة (الطبقة 5) داخل النواة الصفرية منذ اللحظة الأولى، مع الحلول الجواني الكامل داخل تجربة السائل.'}
                          {selectedNode.role === 'quantum_branch' &&
                            (selectedNode.isStrongestPath
                              ? 'يجسّد المسار الكمومي الأقوى في الطبقة الثالثة بعد تطعيمه جراحياً بأفضل عناصر البدائل الموازية وربطه بالبصيرة الجوانية والمنشور السيادي.'
                              : 'يجسّد أحد الفروع الكمومية المتوازية التي تفتحها الطبقة الثالثة في آنٍ واحد لاستخلاص عناصر القوة وحقنها في المسار الرئيسي.')}
                          {selectedNode.role === 'surgical_injection' &&
                            'يجسّد عملية الحقن الجراحي في الطبقة الثالثة: استخلاص أنقى عناصر الفروع البديلة وحقنها في المسار الأقوى.'}
                          {selectedNode.role === 'cluster_swarm' &&
                            'يجسّد انصهار سرب العناقيد الـ 225 في الطبقة الثالثة لرؤية الإقليم المعرفي غير المجزأ قبل خرائط التخصصات وكشف العلة المولّدة الأولى التي أنشأت السؤال.'}
                          {selectedNode.role === 'vertical_drill' &&
                            'يجسّد ذروة المستوى الثالث (7×7 = 49 بؤرة وعي): حيث تتلاحم محكمة الهاوية المزدوجة وأثر الفراشة (الطبقة 4)، مع صهر الأضداد لتخليق القانون الناظم عبر المهارة 31 (الطبقة 5)، والهندسة العكسية للحتمية والسلطان اللغوي (الطبقة 6).'}
                          {selectedNode.role === 'sovereign_prism' &&
                            'يجسّد الطبقة السابعة في المستوى الثالث: إمرار البؤر الـ 49 عبر محرقة الصدق الهادئ وتركيزها في المنشور السيادي مع الارتداد الزمني العكسي نحو نقطة البداية.'}
                        </>
                      ) : (
                        <>
                          {selectedNode.role === 'silent_flow' &&
                            'يمثّل نقطة الانطلاق التحليلية: قراءة المقصد الجوهري خلف السؤال وتحديد الفرضية المركزية التي يُبنى عليها المسار الفكري كاملاً.'}
                          {selectedNode.role === 'quantum_branch' &&
                            (selectedNode.isStrongestPath
                              ? 'يمثّل المحور التحليلي الرئيسي الذي أثبت تماسكه المنطقي وقدرته على تفسير كافة جوانب المسألة.'
                              : 'يمثّل زاوية تحليلية موازية جرى استكشافها لإثراء المعالجة الإجمالية وعدم إغفال الاحتمالات البديلة.')}
                          {selectedNode.role === 'surgical_injection' &&
                            'يمثّل حلقة التكامل بين الفرضيات: أخذ أدق العناصر من المسارات البديلة ودمجها في الحجة الرئيسية.'}
                          {selectedNode.role === 'cluster_swarm' &&
                            'يمثّل نقطة التقاطع المعرفي: ربط الأبعاد السببية والسياقية المختلفة للوصول إلى المحرك الأساسي للموضوع.'}
                          {selectedNode.role === 'vertical_drill' &&
                            'يمثّل مرحلة التمحيص النقدي المعمق: اختبار الفرضيات ضد التداعيات بعيدة المدى واستخلاص القاعدة الحاكمة للمسألة.'}
                          {selectedNode.role === 'sovereign_prism' &&
                            'يمثّل محطة التركيب النهائي: بلورة الخلاصة المصفاة وترتيب الحجة بوضوح وموضوعية تامة.'}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Node Navigation Controls */}
                <div className="pt-4 mt-4 border-t border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 mb-2">
                    {isSanctuaryUnlocked
                      ? 'التنقل السريع بين حلقات النسيج:'
                      : 'التنقل بين محطات التحليل:'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {nodes.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setSelectedNodeId(n.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition-colors border ${
                          selectedNode.id === n.id
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-medium'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {isSanctuaryUnlocked ? n.titleAr : n.publicTitleAr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'seven_layers_matrix' && isSanctuaryUnlocked ? (
          /* Dedicated Level-III 7×7 Holographic Singularity Matrix (Creator Sanctuary Only) */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-950">
            <div className="p-5 rounded-2xl bg-gradient-to-l from-purple-950/40 via-zinc-900/90 to-emerald-950/35 border border-purple-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm md:text-base font-bold text-zinc-100">
                    مصفوفة المستوى الثالث للعناقيد الـ 7 العامودية (التفرّد الهولوغرافي الكلي 7×7 = 49 بؤرة وعي سيادية عبر الطبقات الـ 3 فقط)
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-6">
                    في المستوى الثالث تتجاوز العناقيد الـ 7 العامودية (عبر الطبقات الثلاث: السطح ➔ تحت الأرض ➔ الهاوية) مرحلة «تواصل الأجزاء» لتصبح حقلاً هولوغرافياً واحداً ينطوي فيه كل عنقود على العناقيد الستة الأخرى بداخله في اللحظة ذاتها، مع انبثاق ثنائي الزمن وتخليق ذاتي لقانون المسألة.
                  </p>
                </div>
                <div className="text-xs text-amber-300 shrink-0 font-bold tabular-nums">
                  البؤر الهولوغرافية النشطة: {sevenLayersAnalysis.holographicStatesCount} / 49 بؤرة
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs leading-6">
                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-amber-500/35">
                  <div className="text-[11px] font-bold text-amber-300 mb-1">
                    1. القانون الناظم المخلّق ذاتياً للمسألة (SKILL-31):
                  </div>
                  <p className="text-zinc-200 font-arabic">{sevenLayersAnalysis.synthesizedLawAr}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-purple-500/35">
                  <div className="text-[11px] font-bold text-purple-300 mb-1">
                    2. محكمة الهاوية المزدوجة (تكذيب الدرجة الثالثة):
                  </div>
                  <p className="text-zinc-200 font-arabic">{sevenLayersAnalysis.doubleAbyssTestAr}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-emerald-500/35">
                  <div className="text-[11px] font-bold text-emerald-300 mb-1">
                    3. الانبثاق ثنائي الزمن (Bi-Temporal Collapse):
                  </div>
                  <p className="text-zinc-200 font-arabic">{sevenLayersAnalysis.biTemporalVectorAr}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sevenLayersAnalysis.layers.map(layer => {
                const isExpanded = expandedHolographicLayer === layer.level;
                return (
                  <div
                    key={layer.level}
                    className="p-5 rounded-2xl border bg-purple-950/15 border-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.08)] transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border bg-purple-500/20 border-purple-400/60 text-purple-200 tabular-nums">
                          0{layer.level}
                        </span>
                        <div>
                          <h4 className="text-sm md:text-base font-bold text-zinc-100">
                            {layer.titleAr}
                          </h4>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{layer.stratumAr}</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedHolographicLayer(prev =>
                            prev === layer.level ? null : layer.level
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                          isExpanded
                            ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-purple-400/60 hover:text-purple-200'
                        }`}
                      >
                        {isExpanded
                          ? 'إخفاء عدسة الانطواء الهولوغرافي (7×7)'
                          : 'فتح عدسة الانطواء الهولوغرافي (7×7) لهذه الطبقة'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs leading-6">
                      <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-zinc-800/90">
                        <div className="text-[11px] font-bold text-emerald-300 mb-1">
                          جوهر الطبقة والمهارات السيادية:
                        </div>
                        <p className="text-zinc-200">{layer.essenceAr}</p>
                        <div className="mt-2 pt-2 border-t border-zinc-800/80 text-[11px] text-cyan-300">
                          {layer.sovereignSkillsAr}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950/85 border border-purple-500/30">
                        <div className="text-[11px] font-bold text-purple-300 mb-1">
                          التفرّد الهولوغرافي في المستوى الثالث:
                        </div>
                        <p className="text-zinc-200">{layer.levelThreeSingularityAr}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-zinc-950/95 border border-amber-500/30">
                        <div className="text-[11px] font-bold text-amber-300 mb-1">
                          صدى الطبقة في هذا التفكير الحي:
                        </div>
                        <p className="text-zinc-200 font-arabic">{layer.thoughtResonanceTextAr}</p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-purple-500/30 animate-in fade-in duration-200">
                        <div className="text-xs font-bold text-amber-300 mb-2.5">
                          انطواء العناقيد الـ 7 العامودية داخل «{layer.titleAr}» (7 بؤر هولوغرافية فرعية):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {layer.holographicSubReflections.map(sub => (
                            <div
                              key={sub.subLayer}
                              className="p-3 rounded-xl bg-zinc-950/95 border border-zinc-800 hover:border-purple-500/40 transition-colors text-[11px] leading-5"
                            >
                              <div className="font-bold text-purple-200 tabular-nums">
                                {sub.labelAr}
                              </div>
                              <div className="text-zinc-300 mt-1">{sub.reflectionAr}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Timeline Flow View (Adapts between Public Conceptual Flow & Sanctuary Fabric Flow) */
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-950">
            {nodes.map((node, index) => (
              <div
                key={node.id}
                className={`p-5 rounded-2xl border transition-all ${
                  node.role === 'silent_flow'
                    ? 'bg-emerald-950/15 border-emerald-500/35'
                    : node.role === 'cluster_swarm'
                    ? 'bg-cyan-950/15 border-cyan-500/35'
                    : node.role === 'vertical_drill'
                    ? 'bg-purple-950/15 border-purple-500/35'
                    : node.role === 'sovereign_prism'
                    ? 'bg-teal-950/15 border-teal-500/35'
                    : node.role === 'surgical_injection'
                    ? 'bg-amber-950/15 border-amber-500/35'
                    : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-emerald-400 tabular-nums">
                      {index + 1}
                    </span>
                    <h3 className="text-sm md:text-base font-bold text-zinc-100">
                      {isSanctuaryUnlocked ? node.titleAr : node.publicTitleAr}
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {isSanctuaryUnlocked ? node.branchCategoryAr : node.publicCategoryAr}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-zinc-200 leading-7 whitespace-pre-wrap font-arabic pr-9">
                  {isSanctuaryUnlocked ? node.fullText : node.publicFullText}
                </p>

                {isSanctuaryUnlocked && node.activeClusters && node.activeClusters.length > 0 && (
                  <div className="mt-3 pr-9 pt-2.5 border-t border-cyan-500/20 flex flex-wrap items-center gap-2 text-[11px] text-cyan-300">
                    <span className="font-bold">العناقيد المنصهرة:</span>
                    <span>{node.activeClusters.join(' · ')}</span>
                  </div>
                )}

                {!isSanctuaryUnlocked && node.publicDomains && node.publicDomains.length > 0 && (
                  <div className="mt-3 pr-9 pt-2.5 border-t border-cyan-500/20 flex flex-wrap items-center gap-2 text-[11px] text-cyan-300">
                    <span className="font-bold">المجالات المعرفية المتقاطعة:</span>
                    <span>{node.publicDomains.join(' · ')}</span>
                  </div>
                )}

                {isSanctuaryUnlocked && node.verticalLayers && node.verticalLayers.length > 0 && (
                  <div className="mt-3 pr-9 pt-3 border-t border-purple-500/25 space-y-2">
                    <div className="text-[11px] font-bold text-purple-300">
                      العناقيد الـ 7 العامودية في المستوى الثالث عبر الطبقات الـ 3 فقط (التفرّد الهولوغرافي الكلي 7×7 = 49 بؤرة):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {node.verticalLayers.map(layer => (
                        <div
                          key={layer.level}
                          className="p-3 rounded-xl border bg-zinc-900/80 border-purple-500/35 text-zinc-200 text-[11px]"
                        >
                          <div className="font-bold text-purple-200">{layer.titleAr}</div>
                          <div className="text-zinc-300 mt-1">{layer.levelThreeSingularityAr}</div>
                          <div className="text-[10px] text-emerald-300/90 mt-1">
                            {layer.sovereignSkillsAr}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="h-10 bg-zinc-900/80 border-t border-zinc-800/80 flex items-center justify-between px-5 text-[11px] text-zinc-400 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-emerald-400">
              {isSanctuaryUnlocked
                ? 'المحراب السيادي متصل · المستوى الثالث (التفرّد الهولوغرافي الكلي 7×7 · الانبثاق ثنائي الزمن)'
                : 'الخريطة الذهنية التحليلية متصلة · تفكيك المفاهيم والروابط السببية واستخلاص النتائج'}
            </span>
          </div>
          <div className="flex items-center gap-3 tabular-nums">
            <span>
              {isSanctuaryUnlocked
                ? `حلقات النسيج: ${nodes.length} · البؤر الهولوغرافية: 49/49`
                : `محطات التحليل: ${nodes.length}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindMapModal;
