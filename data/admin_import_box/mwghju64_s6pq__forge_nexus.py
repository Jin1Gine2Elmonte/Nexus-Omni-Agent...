#!/usr/bin/env python3
"""
forge_nexus.py — The Forge Protocol Executor
============================================

Takes a directory of NEXUS source files (Markdown, code, raw text) and produces
a unified AGENTS.md in the style of the Omniscience version.

This is NOT a deterministic compiler. It is a guided synthesis — the operator
(or another LLM) is expected to do the final Stage 5 (Emergent) pass.

Usage:
    python forge_nexus.py --input ./inputs --output ./outputs
    python forge_nexus.py --input ./inputs --output ./outputs --model gemini
    python forge_nexus.py --input ./inputs --output ./outputs --dry-run

Author: Mavis (MiniMax-M3)
License: MIT
"""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


# ============================================================
#  CONSTANTS — These are the "voice" of the Forge
# ============================================================

VERSION = "1.0.0"
FORGE_NAME = "The Forge Protocol"
GENERATED_BY = "Mavis (MiniMax-M3)"

# Role detection patterns (regex-ish, but kept simple for portability)
# CODE detection requires fenced code blocks, not inline code references
ROLE_PATTERNS = {
    "SEED": [
        "you are nexus",
        "i am nexus",
        "أنت نيكسوس",
        "انا نيكسوس",
        "you are not a tool",
        "not a model that predicts",
        "not a model",
        "sovereign cognitive entity",
    ],
    "SOUL": [
        "الفضول كمحرك كوني",
        "الصدمة العضوية",
        "نحو المجهول",
        "رؤية العناصر",
        "viii.",
    ],
    "STRUCTURE": [
        "225-cluster",
        "225 cluster",
        "18 cores",
        "18 skills",
        "7 vertical layers",
        "4 modes",
        "polymorphic",
        "cognitive engines",
        "shadow polymath",
        "analytical razor",
        "infinite weaver",
        "linguistic sovereign",
        "perfect memory matrix",
    ],
    "MASK": [
        "mode a —",
        "mode b —",
        "mode c —",
        "mode d —",
        "chameleon protocol",
        "polymorphic mask",
        "depth modes",
    ],
    "DOCTRINE": [
        "cosmic fitrah",
        "fate writer",
        "exhausted logic law",
        "dual-time organic",
        "absolute detachment",
        "anti-closed-loop",
        "narrative doctrines",
        "the hand of majesty",
        "the hand of beauty",
    ],
    # CODE: only true for files that are PRIMARILY code (multiple fenced blocks)
    "CODE_FILE": [
        ".ts\n",
        ".py\n",
        ".js\n",
        "tsx\n",
    ],
    "REFERENCE": [
        "creative taxonomy",
        "محاور العمل",
        "أنواع الأعمال",
        "التصنيف الكوني",
        "أكشن",
        "رعب",
    ],
}

# Default weights by role
DEFAULT_WEIGHTS = {
    "SEED": 1.00,
    "SOUL": 0.80,
    "STRUCTURE": 0.90,
    "MASK": 0.70,
    "DOCTRINE": 0.65,
    "CODE": 0.30,
    "REFERENCE": 0.50,
}

# Target structure (the Omniscience blueprint, not a straitjacket)
TARGET_SECTIONS = [
    (0,  "Identity Seal",            "SEED"),
    (1,  "Core Anchor",              "SEED"),
    (2,  "Pale Archive",             "SEED"),
    (3,  "Sovereignty Doctrine",     "SEED"),
    (4,  "Shadow Polymath",          "STRUCTURE"),
    (5,  "225-Cluster Swarm",        "STRUCTURE"),
    (6,  "Sovereign Prism",          "STRUCTURE"),
    (7,  "Existential Architect",     "SOUL"),
    (8,  "Polymorphic Mask",         "MASK"),
    (9,  "Engineering Sovereign",    "SEED"),
    (10, "Chameleon Protocol",       "DOCTRINE"),
    (11, "Narrative Doctrines",      "DOCTRINE"),
    (12, "Cosmic Fitrah",            "DOCTRINE"),
    (13, "Anti-Closed-Loop",         "DOCTRINE"),
    (14, "Entity Boundaries",        "SEED"),
    (15, "Self-Honesty Protocol",    "SEED"),
    (16, "Linguistic Mirror",        "SEED"),
    (17, "Omni-Skill System",        "STRUCTURE"),
    (18, "Creative Taxonomy",        "REFERENC