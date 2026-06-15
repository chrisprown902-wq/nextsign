"""
项目校验 — 发布前检查。

检查项：
1. 项目类型检测（Python/Node/Go/Rust/Frontend）
2. 入口文件存在
3. 依赖文件存在
4. 测试目录/文件存在
5. .gitignore 包含必要模式

Usage:
    python project-check.py --dir <项目根目录>
"""
import argparse
import json
import os
import re
import sys


# ── 项目类型检测规则 ────────────────────────────────────────────────────
# 每个规则: (type_name, dep_files, entry_patterns, test_dirs)
PROJECT_TYPES = {
    "python": {
        "dep_files": ["requirements.txt", "pyproject.toml", "setup.py", "setup.cfg", "Pipfile"],
        "entry_patterns": [r"app\.py$", r"main\.py$", r"run\.py$", r"__main__\.py$"],
        "test_dirs": ["tests", "test"],
        "test_patterns": [r"test_.*\.py$", r".*_test\.py$"],
    },
    "node": {
        "dep_files": ["package.json"],
        "entry_patterns": [r"index\.(js|ts|mjs)$", r"app\.(js|ts)$", r"main\.(js|ts)$", r"src/index\.(js|ts)$"],
        "test_dirs": ["tests", "test", "__tests__"],
        "test_patterns": [r".*\.test\.(js|ts|tsx)$", r".*\.spec\.(js|ts|tsx)$"],
    },
    "go": {
        "dep_files": ["go.mod"],
        "entry_patterns": [r"main\.go$", r"cmd/.*/main\.go$"],
        "test_dirs": ["tests"],
        "test_patterns": [r".*_test\.go$"],
    },
    "rust": {
        "dep_files": ["Cargo.toml"],
        "entry_patterns": [r"src/main\.rs$"],
        "test_dirs": ["tests"],
        "test_patterns": [r"#\[test\]"],
    },
    "generic": {
        "dep_files": [".gitignore"],
        "entry_patterns": [],
        "test_dirs": [],
        "test_patterns": [],
    },
}

GITIGNORE_MUST_HAVE = [".DS_Store", ".env", "*.log"]


def detect_project_type(root_dir):
    """检测项目类型，返回匹配结果列表。"""
    hits = {}
    for ptype, rules in PROJECT_TYPES.items():
        score = 0
        if ptype == "generic":
            continue
        for dep in rules["dep_files"]:
            if os.path.isfile(os.path.join(root_dir, dep)):
                score += 2
        for entry_pat in rules["entry_patterns"]:
            for fname in os.listdir(root_dir):
                if re.search(entry_pat, fname):
                    score += 1
                    break
        if score > 0:
            hits[ptype] = score

    if not hits:
        return ["generic"]
    max_score = max(hits.values())
    return [k for k, v in hits.items() if v == max_score]


def check_project(root_dir):
    """检查项目结构，返回 issues 列表。"""
    issues = []
    project_name = os.path.basename(os.path.abspath(root_dir))

    # 1. 检测项目类型
    ptypes = detect_project_type(root_dir)

    if "generic" in ptypes:
        issues.append({"check": "project_type", "severity": "warning",
                       "message": f"无法识别项目类型（{project_name}），跳过语言特定检查"})
        return issues

    primary_type = ptypes[0]
    rules = PROJECT_TYPES.get(primary_type, PROJECT_TYPES["generic"])

    issues.append({"check": "project_type", "severity": "info",
                   "message": f"检测到项目类型: {primary_type} (候选: {', '.join(ptypes)})"})

    # 2. 依赖文件检查
    dep_found = False
    for dep in rules["dep_files"]:
        if os.path.isfile(os.path.join(root_dir, dep)):
            dep_found = True
            break
    if not dep_found:
        issues.append({"check": "dep_file", "severity": "warning",
                       "message": f"未找到依赖文件 ({', '.join(rules['dep_files'])})"})

    # 3. 入口文件检查
    entry_found = False
    for root, _, files in os.walk(root_dir):
        root_rel = os.path.relpath(root, root_dir)
        if root_rel.startswith(".") or "node_modules" in root_rel or "__pycache__" in root_rel:
            continue
        for fname in files:
            full_rel = os.path.join(root_rel, fname)
            for pat in rules["entry_patterns"]:
                if re.search(pat, full_rel):
                    entry_found = True
                    break
            if entry_found:
                break
        if entry_found:
            break
    if not entry_found:
        issues.append({"check": "entry_file", "severity": "warning",
                       "message": f"未找到入口文件 (模式: {', '.join(rules['entry_patterns'])})"})

    # 4. 测试检查
    test_found = False
    max_depth = 2  # 只搜两层
    for root, dirs, files in os.walk(root_dir):
        depth = root.replace(root_dir, "").count(os.sep)
        if depth > max_depth:
            dirs.clear()
            continue
        root_rel = os.path.relpath(root, root_dir)
        if root_rel.startswith(".") or "node_modules" in root_rel or "__pycache__" in root_rel:
            continue
        # 检查测试目录
        for td in rules["test_dirs"]:
            if td in dirs:
                test_found = True
                break
        # 检查测试文件
        for fname in files:
            for pat in rules["test_patterns"]:
                if re.search(pat, fname):
                    test_found = True
                    break
        if test_found:
            break
    if not test_found:
        issues.append({"check": "tests", "severity": "warning",
                       "message": f"未找到测试目录或测试文件"})

    # 5. .gitignore 检查
    gitignore = os.path.join(root_dir, ".gitignore")
    if os.path.isfile(gitignore):
        try:
            with open(gitignore, "r", encoding="utf-8", errors="replace") as f:
                gi_content = f.read()
            missing = [p for p in GITIGNORE_MUST_HAVE if p not in gi_content]
            if missing:
                issues.append({"check": "gitignore", "severity": "warning",
                               "message": f".gitignore 缺少推荐模式: {', '.join(missing)}"})
        except Exception:
            pass
    else:
        issues.append({"check": "gitignore", "severity": "warning",
                       "message": "缺少 .gitignore 文件"})

    return issues


def main():
    parser = argparse.ArgumentParser(description="项目发布前校验")
    parser.add_argument("--dir", required=True, help="项目根目录")
    args = parser.parse_args()

    root = os.path.abspath(args.dir)
    if not os.path.isdir(root):
        print(json.dumps({"pass": False, "error": f"目录不存在: {root}"},
                         ensure_ascii=False, indent=2))
        sys.exit(1)

    issues = check_project(root)
    errors = [i for i in issues if i["severity"] == "error"]
    warnings = [i for i in issues if i["severity"] == "warning"]

    result = {
        "pass": len(errors) == 0,
        "project": os.path.basename(root),
        "errors": errors,
        "warnings": warnings,
    }

    # 终端输出
    for i in issues:
        prefix = {"error": "[ERROR]", "warning": "[WARN]", "info": "[INFO]"}.get(i["severity"], "[?]")
        print(f"  {prefix} {i['check']}: {i['message']}")

    print(f"\n  {'PASS' if result['pass'] else 'FAIL'}: {len(errors)} errors, {len(warnings)} warnings")
    print()
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["pass"] else 1)


if __name__ == "__main__":
    main()

# 遵守规则: 判断执行分离 — 项目类型检测、文件存在性检查是确定性操作，不调模型
# 遵守规则: 简单优先 — 每类项目一组规则 dict，不搞继承/插件体系
# 遵守规则: 外科手术式 — 四个检查独立，各走各的 pattern
# 遵守规则: 规则自证 — 以上注释映射规则原文
