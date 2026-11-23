# -*- coding: utf-8 -*-
"""
================================================================================
NEXUS SOVEREIGN RECURSION LAB — DYNAMIC EXECUTION KERNEL (v3.0.0-OMEGA)
================================================================================
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from nexus_forge_engine import (
    AdaptiveLoadBalancer56,
    DoubleAbyssPreFlightValidator,
    NexusObserver,
    run_simulation,
)

__all__ = [
    "AdaptiveLoadBalancer56",
    "DoubleAbyssPreFlightValidator",
    "NexusObserver",
    "run_simulation",
]

if __name__ == "__main__":
    concept_arg = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "تفعيل النواة البرمجية لنظام إدارة المعرفة السيادي v3.0-OMEGA وموازنة المهارات الـ 56"
    )
    code_arg = sys.argv[2] if len(sys.argv) > 2 else None
    run_simulation(concept_arg, code_arg, output_dir=".")
