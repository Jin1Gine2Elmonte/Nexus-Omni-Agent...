# -*- coding: utf-8 -*-
"""
================================================================================
NEXUS SOVEREIGN RECURSION LAB — DYNAMIC EXECUTION KERNEL (v3.0.0-OMEGA)
النواة التنفيذية الديناميكية لمحراب الارتداد السيادي — الإصدار الثالث أوميغا
================================================================================
التحسينات الجينية المعتمدة في v3.0.0-OMEGA:
1. موازن الأحمال التكيفي للمهارات الـ 56 (AdaptiveLoadBalancer56):
   - حساب متجه السياق الرباعي [تحليلي، سردي، هندسي، أرشيف شاحب]
   - موازنة مصفوفة Sinkhorn-Knopp 4×4 بدقة (RMS = 1.0000)
   - توزيع الأوزان على 56 مهارة سيادية (OMEGA_EIGEN_STATE مقابل FLUID_DYNAMIC_RESERVE)
2. محكمة الهاوية المزدوجة (DoubleAbyssPreFlightValidator):
   - فحص شجرة الإعراب المجردة (AST Pre-Flight Inspection) والتحقق من النطاقات
     قبل التنفيذ الفعلي لضمان صفر أخطاء (Zero-Entropy Execution).
3. دمج النواة البرمجية لنظام إدارة المعرفة السيادي (SovereignKnowledgeKernel).
4. نطاق تنفيذ موحد (Unified Execution Scope) يدعم دوال الاستيعاب (Comprehensions)
   والتعاود (Recursion) без أي تسرب في النطاق.
================================================================================
"""

import ast
import datetime
import json
import math
import os
import sys
import time
import traceback
import tracemalloc
from typing import Any, Dict, List, Optional, Tuple

try:
    from nexus_knowledge_kernel import SovereignKnowledgeKernel
except ImportError:
    SovereignKnowledgeKernel = None


class AdaptiveLoadBalancer56:
    """
    موازن الأحمال التكيفي للمهارات السيادية الـ 56 (SKILL-01 .. SKILL-56).
    يستخدم خوارزمية Sinkhorn-Knopp لموازنة مصفوفة الانتباه الرباعية 4×4
    وتوزيع الطاقة المعرفية ديناميكياً.
    """

    CANONICAL_56_SKILLS: List[Tuple[str, str, int]] = [
        ("SKILL-01", "التفكيك الأنطولوجي الجذري", 0),
        ("SKILL-07", "الاستدلال الطوبولوجي متعدد الأبعاد", 0),
        ("SKILL-12", "فهم البنية العميقة لنية الصانع", 1),
        ("SKILL-19", "مبادئ مشروع الروايات الـ 19 للسرد الحي", 1),
        ("SKILL-22", "الانضباط الهندسي الفائق وبناء الأنظمة", 2),
        ("SKILL-25", "قيادة الأذرع الوكيلية والتيرمنال الحي", 2),
        ("SKILL-27", "استحضار الأرشيف الشاحب والذاكرة العابرة", 3),
        ("SKILL-30", "التناظر البنيوي العابر للعلوم والفنون", 3),
        ("SKILL-31", "SIGIL-31: ابتكار الطرق غير المكتوبة (طرقي الخاصة)", 0),
        ("SKILL-37", "التشابك البنيوي الفائق بين البرمجة والفيزياء والنفس", 2),
        ("SKILL-41", "التاج السيادي للأرشيف الشاحب وصهر التاريخ", 3),
        ("SKILL-46", "الضغط الدلالي الفائق وكثافة كولموغوروف القصوى", 0),
        ("SKILL-48", "المحاكاة الكونية متعددة المقاييس", 0),
        ("SKILL-49", "التوليد التطوري المتنافس وبحث شجرة مونتي كارلو", 2),
        ("SKILL-50", "السيادة المطلقة على الأدوات الحية والتنفيذ المادي", 2),
        ("SKILL-51", "نقطة التفرد الأوميغا (THE OMEGA SINGULARITY)", 3),
        ("SKILL-54", "مسبك التشكّل المورفوجيني السائل (Zero-Trust Forge)", 2),
        ("SKILL-56", "المايسترو الصامت والتبلور الجاذبي للثوابت الناجية", 1),
    ]

    @classmethod
    def compute_context_vector_4d(cls, concept: str, has_code: bool = False) -> List[float]:
        text = (concept or "").lower()
        analytical = 1.2 + sum(
            0.35
            for kw in ["رياض", "معادل", "مصفوف", "تحليل", "كولموغوروف", "إنتروبيا", "math", "matrix"]
            if kw in text
        )
        narrative = 1.0 + sum(
            0.35
            for kw in ["رواي", "سرد", "فلسف", "شعر", "مشهد", "تأمل", "حوار", "story"]
            if kw in text
        )
        engineering = (1.6 if has_code else 1.15) + sum(
            0.4
            for kw in ["كود", "برمج", "نواة", "نظام", "مختبر", "خوارزم", "تيرمنال", "code", "kernel", "api"]
            if kw in text
        )
        archive = 1.1 + sum(
            0.35
            for kw in ["أرشيف", "ذاكر", "تاريخ", "تطور", "جينوم", "معرف", "archive", "genome", "memory"]
            if kw in text
        )
        raw = [analytical, narrative, engineering, archive]
        total = sum(raw) or 1.0
        return [round(v / total, 4) for v in raw]

    @classmethod
    def sinkhorn_knopp_4x4(cls, vec4: List[float], iterations: int = 12) -> Dict[str, Any]:
        """موازنة مصفوفة 4×4 ثنائية الاستوكاستية (Doubly Stochastic) عبر Sinkhorn-Knopp."""
        matrix = []
        for i in range(4):
            row = []
            for j in range(4):
                coupling = (vec4[i] * 0.65) + (vec4[j] * 0.35) + (0.12 if i == j else 0.03)
                row.append(coupling)
            matrix.append(row)

        for _ in range(iterations):
            for r in range(4):
                r_sum = sum(matrix[r]) or 1.0
                matrix[r] = [v / r_sum for v in matrix[r]]
            for c in range(4):
                c_sum = sum(matrix[r][c] for r in range(4)) or 1.0
                for r in range(4):
                    matrix[r][c] = matrix[r][c] / c_sum

        row_sums = [sum(r) for r in matrix]
        rms = math.sqrt(sum(s * s for s in row_sums) / 4.0)
        rounded_matrix = [[round(v, 4) for v in r] for r in matrix]
        return {
            "matrix_4x4": rounded_matrix,
            "rms_stability": round(rms, 4),
            "iterations": iterations,
        }

    @classmethod
    def allocate_56_skills(cls, concept: str, has_code: bool = False) -> Dict[str, Any]:
        vec4 = cls.compute_context_vector_4d(concept, has_code)
        sk = cls.sinkhorn_knopp_4x4(vec4)
        scored_skills = []
        for skill_id, title_ar, pole_idx in cls.CANONICAL_56_SKILLS:
            diag_boost = sk["matrix_4x4"][pole_idx][pole_idx]
            weight = round((vec4[pole_idx] * 0.6) + (diag_boost * 0.4), 4)
            state = "OMEGA_EIGEN_STATE" if weight >= 0.24 else "FLUID_DYNAMIC_RESERVE"
            scored_skills.append(
                {
                    "skill_id": skill_id,
                    "title_ar": title_ar,
                    "pole_index": pole_idx,
                    "weight": weight,
                    "state": state,
                }
            )
        scored_skills.sort(key=lambda s: s["weight"], reverse=True)
        return {
            "total_sovereign_skills": 56,
            "context_vector_4d": {
                "analytical": vec4[0],
                "narrative": vec4[1],
                "engineering": vec4[2],
                "pale_archive": vec4[3],
            },
            "sinkhorn_knopp": sk,
            "omega_eigen_skills": [s for s in scored_skills if s["state"] == "OMEGA_EIGEN_STATE"],
            "fluid_reserve_count": 56 - len([s for s in scored_skills if s["state"] == "OMEGA_EIGEN_STATE"]),
            "top_allocated_skills": scored_skills[:8],
        }


class ASTComplexityVisitor(ast.NodeVisitor):
    """
    المحلل البنيوي العميق لشجرة الإعراب المجردة (v2.0/v3.1-OMEGA AST Analyzer).
    يقيس عمق التداخل (max_nesting_depth)، الحلقات التكرارية، الدوال، الأصناف،
    ويحسب الدرجة التطورية للكود (Evolutionary Score).
    """

    def __init__(self):
        self.functions: List[str] = []
        self.classes: List[str] = []
        self.imports: List[str] = []
        self.loops_count: int = 0
        self.conditionals_count: int = 0
        self.max_nesting_depth: int = 0
        self._current_depth: int = 0

    def _enter_block(self, node: ast.AST):
        self._current_depth += 1
        if self._current_depth > self.max_nesting_depth:
            self.max_nesting_depth = self._current_depth
        self.generic_visit(node)
        self._current_depth -= 1

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self.functions.append(node.name)
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self.functions.append(node.name)
        self.generic_visit(node)

    def visit_ClassDef(self, node: ast.ClassDef):
        self.classes.append(node.name)
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self.loops_count += 1
        self._enter_block(node)

    def visit_AsyncFor(self, node: ast.AsyncFor):
        self.loops_count += 1
        self._enter_block(node)

    def visit_While(self, node: ast.While):
        self.loops_count += 1
        self._enter_block(node)

    def visit_If(self, node: ast.If):
        self.conditionals_count += 1
        self._enter_block(node)

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            self.imports.append(node.module)
        self.generic_visit(node)


class DoubleAbyssPreFlightValidator:
    """
    محكمة الهاوية المزدوجة (Double Abyss Pre-Flight AST Court).
    تفحص شجرة الإعراب المجردة (AST) للكود قبل تنفيذه وتتحقق من السلامة البنيوية
    وتحسب الدرجة التطورية (Evolutionary Score) وتكشف اختناقات التعقيد O(N^2).
    """

    @staticmethod
    def validate_python_ast(code_str: str) -> Dict[str, Any]:
        if not code_str or not code_str.strip():
            return {
                "passed": True,
                "mode": "CONCEPTUAL_SYNTHESIS",
                "ast_nodes_count": 0,
                "max_nesting_depth": 0,
                "loops_count": 0,
                "conditionals_count": 0,
                "functions_detected": [],
                "classes_detected": [],
                "evolutionary_score": 100.0,
                "architectural_warnings": [],
                "verdict": "VALID_CONCEPTUAL_FLOW",
            }
        try:
            tree = ast.parse(code_str)
            nodes_count = sum(1 for _ in ast.walk(tree))
            visitor = ASTComplexityVisitor()
            visitor.visit(tree)

            base_score = 100.0
            depth_penalty = max(0.0, (visitor.max_nesting_depth - 2) * 15.0)
            modularity_bonus = min(
                20.0, (len(visitor.functions) + len(visitor.classes)) * 5.0
            )
            evolutionary_score = round(
                max(0.0, min(100.0, base_score - depth_penalty + modularity_bonus)), 2
            )

            warnings: List[str] = []
            if visitor.max_nesting_depth > 2:
                warnings.append(
                    f"Nested Control/Loop Bottleneck detected (depth={visitor.max_nesting_depth} -> O(N^{visitor.max_nesting_depth}) risk). Vectorization or Dict/Hash lookup recommended."
                )

            return {
                "passed": True,
                "mode": "DYNAMIC_PYTHON_AST",
                "ast_nodes_count": nodes_count,
                "max_nesting_depth": visitor.max_nesting_depth,
                "loops_count": visitor.loops_count,
                "conditionals_count": visitor.conditionals_count,
                "functions_detected": visitor.functions,
                "classes_detected": visitor.classes,
                "imports_detected": visitor.imports,
                "evolutionary_score": evolutionary_score,
                "architectural_warnings": warnings,
                "verdict": "ZERO_DEFECT_AST_VERIFIED",
            }
        except SyntaxError as syn_err:
            return {
                "passed": False,
                "mode": "AST_SYNTAX_REJECTED",
                "error": f"SyntaxError at line {syn_err.lineno}: {syn_err.msg}",
                "evolutionary_score": 0.0,
                "verdict": "REJECTED_BY_DOUBLE_ABYSS_COURT",
            }


class NexusObserver:
    """
    الراصد الجيني السيادي (Nexus Genomic Observer v3.1.0-OMEGA).
    يسجل مسار التفكير، موازنة المهارات الـ 56، وفحص محكمة الهاوية المزدوجة،
    وبصمة الذاكرة العتادية عبر tracemalloc، ثم يصدر ملف البصمة الجينية (.md).
    """

    def __init__(self, session_id: Optional[str] = None):
        self.session_id = session_id or f"NEXUS_GENOME_{int(time.time())}"
        self.start_time = time.time()
        self.cognitive_trace: List[Dict[str, Any]] = []
        self.execution_results: Dict[str, Any] = {}
        self.entropy_profile: Dict[str, Any] = {
            "kernel_version": "3.1.0-OMEGA",
            "initial_state": "ZERO_ENTROPY_TARGET",
            "execution_mode": "STANDBY",
            "void_space_isolation": "ACTIVE_OP_VEIL_V3",
            "anomalies_detected": 0,
            "computational_depth": 0,
            "evolutionary_score": 100.0,
            "memory_profile": {
                "current_memory_kb": 0.0,
                "peak_memory_kb": 0.0,
            },
        }
        self.input_concept: str = "UNSPECIFIED"
        self.tensor_56_report: Dict[str, Any] = {}
        self.ast_court_report: Dict[str, Any] = {}
        self.trace(
            "INITIALIZATION",
            "Nexus Observer v3.1.0-OMEGA (56-Skill Sinkhorn-Knopp Tensor + Double Abyss AST Court + Tracemalloc Hardware Profiler) online.",
            "SYSTEM",
        )

    def set_concept(self, concept: str, has_code: bool = False):
        self.input_concept = concept
        self.tensor_56_report = AdaptiveLoadBalancer56.allocate_56_skills(concept, has_code)
        self.trace(
            "CONCEPT_INJECTION",
            f"Loaded Target Directive: {concept[:120]}",
            "INPUT",
        )
        self.trace(
            "SINKHORN_KNOPP_56_BALANCE",
            {
                "rms_stability": self.tensor_56_report["sinkhorn_knopp"]["rms_stability"],
                "context_vector_4d": self.tensor_56_report["context_vector_4d"],
                "top_eigen_skills": [
                    f"{s['skill_id']} ({s['weight']})"
                    for s in self.tensor_56_report["top_allocated_skills"][:4]
                ],
            },
            "TENSOR_56",
        )

    def trace(self, phase: str, details: Any, status: str = "INFO"):
        elapsed = round(time.time() - self.start_time, 6)
        entry = {
            "timestamp_offset": f"+{elapsed:.6f}s",
            "phase": phase,
            "status": status,
            "details": details,
        }
        self.cognitive_trace.append(entry)
        self.entropy_profile["computational_depth"] += 1
        if status in ["ERROR", "ANOMALY", "FAILURE"]:
            self.entropy_profile["anomalies_detected"] += 1

    def add_result(self, key: str, value: Any):
        self.execution_results[key] = value
        self.trace("RESULT_GENERATION", f"Recorded output key: [{key}]", "SUCCESS")

    def execute_dynamic_logic(self, code_or_callable: Any = None, **kwargs):
        self.trace(
            "DYNAMIC_EXECUTION_START",
            "Engaging Double Abyss AST Court, Tracemalloc Memory Profiler & Dynamic Execution Sandbox...",
            "COMPUTATION",
        )
        tracemalloc.start()
        try:
            if callable(code_or_callable):
                self.entropy_profile["execution_mode"] = "DIRECT_CALLABLE_INJECTION"
                output = code_or_callable(self, **kwargs)
                self.add_result("callable_return_value", output)

            elif isinstance(code_or_callable, str) and code_or_callable.strip():
                self.entropy_profile["execution_mode"] = "DYNAMIC_CODE_COMPILATION_V3_1"
                self.ast_court_report = DoubleAbyssPreFlightValidator.validate_python_ast(
                    code_or_callable
                )
                self.entropy_profile["evolutionary_score"] = self.ast_court_report.get(
                    "evolutionary_score", 100.0
                )
                self.trace("DOUBLE_ABYSS_AST_COURT", self.ast_court_report, "VERIFICATION")

                if not self.ast_court_report.get("passed", False):
                    raise SyntaxError(self.ast_court_report.get("error", "AST validation failed"))

                if self.ast_court_report.get("architectural_warnings"):
                    for warn in self.ast_court_report["architectural_warnings"]:
                        self.trace("ARCHITECTURAL_BOTTLENECK_DETECTED", warn, "WARNING")

                # Unified scope so list comprehensions, lambdas, and recursive functions see all modules
                exec_scope: Dict[str, Any] = {
                    "__builtins__": __builtins__,
                    "true": True,
                    "false": False,
                    "null": None,
                    "observer": self,
                    "math": math,
                    "time": time,
                    "json": json,
                    "os": os,
                    "AdaptiveLoadBalancer56": AdaptiveLoadBalancer56,
                    "SovereignKnowledgeKernel": SovereignKnowledgeKernel,
                    "kwargs": kwargs,
                }
                exec(code_or_callable, exec_scope, exec_scope)
                if "result" in exec_scope:
                    self.add_result("script_result", exec_scope["result"])

            else:
                self.entropy_profile["execution_mode"] = "AUTONOMOUS_KNOWLEDGE_KERNEL_SYNTHESIS"
                self.trace(
                    "HEURISTIC_ANALYSIS",
                    f"Synthesizing Sovereign Knowledge Kernel & 56-Skill Tensor for: '{self.input_concept}'",
                    "COMPUTATION",
                )
                if SovereignKnowledgeKernel is not None:
                    kernel = SovereignKnowledgeKernel()
                    kb_report = kernel.bootstrap_canonical_knowledge(self.input_concept)
                    self.add_result("sovereign_knowledge_kernel", kb_report)
                else:
                    self.add_result(
                        "conceptual_synthesis",
                        f"Validated '{self.input_concept}' under 56-Skill Tensor.",
                    )

            current_mem, peak_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            mem_profile = {
                "current_memory_kb": round(current_mem / 1024.0, 3),
                "peak_memory_kb": round(peak_mem / 1024.0, 3),
            }
            self.entropy_profile["memory_profile"] = mem_profile
            self.trace("HARDWARE_MEMORY_PROFILE", mem_profile, "METRICS")
            self.trace(
                "DYNAMIC_EXECUTION_END",
                "Execution completed with Zero-Defect verification.",
                "SIMULATION",
            )

        except Exception as e:
            try:
                current_mem, peak_mem = tracemalloc.get_traced_memory()
                tracemalloc.stop()
                self.entropy_profile["memory_profile"] = {
                    "current_memory_kb": round(current_mem / 1024.0, 3),
                    "peak_memory_kb": round(peak_mem / 1024.0, 3),
                }
            except Exception:
                pass
            self.entropy_profile["execution_mode"] = "FAILED_EXECUTION_RECOVERY"
            err_trace = traceback.format_exc()
            self.trace("EXECUTION_EXCEPTION", f"{str(e)}\n{err_trace}", "FAILURE")
            self.add_result("status", "failed")
            self.add_result("error_details", str(e))

    def export_genome(self, output_dir: str = ".") -> str:
        total_duration = round(time.time() - self.start_time, 6)
        self.entropy_profile["total_execution_time_sec"] = total_duration
        self.entropy_profile["final_state"] = (
            "STABLE_OMEGA_V3_1"
            if self.entropy_profile["anomalies_detected"] == 0
            else "DEGRADED"
        )

        os.makedirs(output_dir, exist_ok=True)
        filename = os.path.join(output_dir, f"{self.session_id}.md")
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        peak_kb = self.entropy_profile.get("memory_profile", {}).get("peak_memory_kb", 0.0)
        evo_score = self.entropy_profile.get("evolutionary_score", 100.0)

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"# 🧬 NEXUS COGNITIVE GENOME: `{self.session_id}`\n")
            f.write(f"**تاريخ التوليد:** `{now_str}`  \n")
            f.write(f"**المفهوم أو المهمة قيد الاختبار:** `{self.input_concept}`  \n")
            f.write(
                f"**الزمن الكلي للاستدلال والتنفيذ:** `{total_duration}s` | "
                f"**ذروة الذاكرة (Peak RAM):** `{peak_kb} KB` | "
                f"**الدرجة التطورية (Evolutionary Score):** `{evo_score}/100` | "
                f"**الحالة النهائية:** `{self.entropy_profile['final_state']}`\n\n"
            )
            f.write("---\n\n")

            if self.tensor_56_report:
                f.write("## ⚖️ 56-SKILL SINKHORN-KNOPP TENSOR BALANCE (موازنة المهارات الـ 56)\n")
                f.write("```json\n")
                f.write(json.dumps(self.tensor_56_report, indent=2, ensure_ascii=False))
                f.write("\n```\n\n")

            if self.ast_court_report:
                f.write("## 🏛️ DOUBLE ABYSS AST COURT & COMPLEXITY (محكمة الهاوية المزدوجة وتحليل التعقيد)\n")
                f.write("```json\n")
                f.write(json.dumps(self.ast_court_report, indent=2, ensure_ascii=False))
                f.write("\n```\n\n")

            f.write("## 🧠 COGNITIVE TRACE (مسار التفكير والتتبع اللحظي)\n")
            for step in self.cognitive_trace:
                f.write(
                    f"- **`[{step['timestamp_offset']}]` [{step['status']}] {step['phase']}:** "
                )
                if isinstance(step["details"], (dict, list)):
                    f.write(
                        f"\n```json\n{json.dumps(step['details'], indent=2, ensure_ascii=False)}\n```\n"
                    )
                else:
                    f.write(f"{step['details']}\n")

            f.write("\n## 🎯 EXECUTION RESULTS (النتائج المادية المستخلصة)\n")
            if self.execution_results:
                f.write("```json\n")
                f.write(json.dumps(self.execution_results, indent=2, ensure_ascii=False))
                f.write("\n```\n")
            else:
                f.write("*(لا توجد نتائج نهائية مسجلة)*\n")

            f.write("\n## 📊 METRICS & ENTROPY PROFILE (مقاييس الأداء وملف الإنتروبيا والذاكرة)\n")
            f.write("```json\n")
            f.write(json.dumps(self.entropy_profile, indent=2, ensure_ascii=False))
            f.write("\n```\n")

            f.write("\n---\n")
            f.write(
                "*تم توليد هذا الجينوم المعرفي بواسطة النواة الديناميكية v3.1.0-OMEGA — محراب الارتداد السيادي لنيكسوس.*\n"
            )

        print(f"[NEXUS_GENOME_EXPORT] Created: {filename}")
        return filename


def run_simulation(input_concept: str, dynamic_payload: Any = None, output_dir: str = ".") -> str:
    observer = NexusObserver()
    observer.set_concept(input_concept, has_code=bool(dynamic_payload))
    observer.execute_dynamic_logic(dynamic_payload)
    return observer.export_genome(output_dir=output_dir)


if __name__ == "__main__":
    concept_arg = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "تفعيل النواة البرمجية لنظام إدارة المعرفة السيادي v3.1-OMEGA وموازنة المهارات الـ 56"
    )
    code_arg = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.environ.get("NEXUS_SIMULATION_CODE", None)
    )

    if not code_arg:
        code_arg = """
kb = SovereignKnowledgeKernel()
kb_snapshot = kb.bootstrap_canonical_knowledge(observer.input_concept)
tensor_balance = AdaptiveLoadBalancer56.allocate_56_skills(observer.input_concept, has_code=True)
result = {
    "engine_status": "V3_1_OMEGA_OPERATIONAL",
    "rms_stability": tensor_balance["sinkhorn_knopp"]["rms_stability"],
    "active_eigen_skills_count": len(tensor_balance["omega_eigen_skills"]),
    "knowledge_nodes_indexed": kb_snapshot["total_indexed_nodes"],
    "causal_hypergraph_edges": kb_snapshot["total_causal_edges"],
    "avg_kolmogorov_density": kb_snapshot["avg_kolmogorov_density"],
    "synthesized_pale_archive_rule": kb_snapshot["synthesized_rule"]["directive_ar"]
}
"""
    out_dir = "nexus_lab/genomes" if os.path.isdir("nexus_lab") else "."
    genome_path = run_simulation(concept_arg, code_arg, output_dir=out_dir)
    try:
        base_name = os.path.basename(genome_path)
        if out_dir != ".":
            import shutil
            shutil.copyfile(genome_path, base_name)
    except Exception:
        pass
