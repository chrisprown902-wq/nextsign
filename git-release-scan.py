"""
GitHub Release -- Step 4.5: Security scan of release directory.

Scans all .md/.py/.js/.json/.yaml/.sh/.ps1 files in a release directory
for 7 categories of sensitive information. Some are hard blockers (exit 1),
others are warnings (exit 0 but reported).

Usage:
    python git-release-scan.py --dir <path>
"""
import argparse
import json
import os
import re
import sys

# ── File extensions to scan ──────────────────────────────────────────────
SCAN_EXTENSIONS = {".md", ".py", ".js", ".json", ".yaml", ".sh", ".ps1", ".yml"}

# ── Scan rules ───────────────────────────────────────────────────────────
# Each rule: (type_name, pattern, is_blocking)
SCAN_RULES = [
    # 1. Local absolute paths — WARNING
    ("local_path", re.compile(r"[A-Za-z]:\\Users\\|D:\\\\|~\/|\/home\/"), False),
    # 2. API Key/Token — BLOCKING
    ("api_key_token", re.compile(
        r"sk-[a-zA-Z0-9_-]{10,}|api_key\s*=|token\s*=|secret\s*=|password\s*=|access_key\s*=|AUTH_TOKEN|API_KEY",
        re.IGNORECASE
    ), True),
    # 3. Private key — BLOCKING
    ("private_key", re.compile(r"-----BEGIN.*PRIVATE KEY"), True),
    # 4. IP address — WARNING (filter localhost/0.0.0.0/255 below)
    ("ip_address", re.compile(r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"), False),
    # 5. Email — WARNING
    ("email", re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"), False),
    # 6. Database connection strings — BLOCKING
    ("db_connection", re.compile(
        r"jdbc:|mongodb://|postgres://|mysql://|sqlite:|redis://"
    ), True),
    # 7. Intranet URLs — WARNING
    ("intranet_url", re.compile(r"localhost:|127\.0\.0\.1:|192\.168\.|\.local\b"), False),
]

# IPs to skip (localhost, broadcast, etc.)
IP_SKIP = {
    "0.0.0.0", "127.0.0.1", "255.255.255.255", "255.255.255.0",
    "1.1.1.1", "8.8.8.8", "8.8.4.4",  # common DNS — arguably skippable but kept for now
}


def should_skip_ip(ip_text):
    """Filter out known-safe IPs like localhost and broadcast."""
    return ip_text in IP_SKIP


def scan_file(filepath):
    """Scan a single file, return (blocking_list, warning_list)."""
    blocking = []
    warnings = []

    try:
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()
    except Exception as e:
        warnings.append({"file": filepath, "line": 0, "type": "read_error", "content": str(e)})
        return blocking, warnings

    for line_num, line in enumerate(lines, start=1):
        for type_name, pattern, is_blocking in SCAN_RULES:
            matches = pattern.findall(line)
            if not matches:
                continue

            for m in matches:
                match_text = m if isinstance(m, str) else str(m)

                # Special filtering for IPs
                if type_name == "ip_address" and should_skip_ip(match_text.strip()):
                    continue

                entry = {
                    "file": os.path.relpath(filepath),
                    "line": line_num,
                    "type": type_name,
                    "content": match_text.strip(),
                }
                if is_blocking:
                    blocking.append(entry)
                else:
                    warnings.append(entry)

    return blocking, warnings


def scan_directory(root_dir):
    """Walk directory and scan all matching files. Returns full report."""
    blocking = []
    warnings = []
    files_scanned = 0

    for dirpath, _, filenames in os.walk(root_dir):
        # Skip hidden directories
        parts = set(os.path.relpath(dirpath, root_dir).split(os.sep))
        if any(p.startswith(".") for p in parts if p and p != "."):
            continue

        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext not in SCAN_EXTENSIONS:
                continue
            filepath = os.path.join(dirpath, fname)
            files_scanned += 1
            b, w = scan_file(filepath)
            blocking.extend(b)
            warnings.extend(w)

    return blocking, warnings, files_scanned


def check_skill_description(skill_dir):
    """Validate SKILL.md description has both Chinese and English trigger words."""
    skill_md = os.path.join(skill_dir, "SKILL.md")
    if not os.path.isfile(skill_md):
        return ["SKILL.md not found in scanned directory, cannot verify description triggers"]

    try:
        with open(skill_md, "r", encoding="utf-8") as f:
            content = f.read()

        # Extract frontmatter description
        desc_match = re.search(r"^description:\s*(.+)$", content, re.MULTILINE)
        if not desc_match:
            return ["SKILL.md frontmatter missing 'description' field"]

        description = desc_match.group(1)

        # Count Chinese characters
        chinese_chars = len(re.findall(r"[一-鿿]", description))
        # Count English words (sequences of 2+ ASCII letters)
        english_words = len(re.findall(r"[a-zA-Z]{2,}", description))

        issues = []
        if chinese_chars < 2:
            issues.append("description has fewer than 2 Chinese characters (found {})".format(chinese_chars))
        if english_words < 2:
            issues.append("description has fewer than 2 English words (found {})".format(english_words))
        return issues if issues else []
    except Exception as e:
        return ["Error reading SKILL.md for description check: {}".format(str(e))]


def main():
    parser = argparse.ArgumentParser(description="Security scan for GitHub release")
    parser.add_argument("--dir", required=True, help="Release directory path")
    args = parser.parse_args()

    root = os.path.abspath(args.dir)
    if not os.path.isdir(root):
        print(json.dumps({"pass": False, "blocking": [], "warnings": [
            {"file": "", "line": 0, "type": "dir_error", "content": "Directory not found: {}".format(root)}
        ], "files_scanned": 0}, ensure_ascii=False, indent=2))
        sys.exit(1)

    blocking, warnings, files_scanned = scan_directory(root)

    # Extra: check SKILL.md description
    desc_issues = check_skill_description(root)
    for issue in desc_issues:
        warnings.append({
            "file": "SKILL.md (frontmatter)",
            "line": 0,
            "type": "description_warning",
            "content": issue,
        })

    passed = len(blocking) == 0

    report = {
        "pass": passed,
        "blocking": blocking,
        "warnings": warnings,
        "files_scanned": files_scanned,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()

# 遵守规则: 判断执行分离 — 安全扫描是确定性正则匹配,写成脚本;模型负责解读报告和决策是否放行
# 遵守规则: 简单优先 — 每个检测函数独立,无继承层次;scan_file 和 scan_directory 各干一件事
# 遵守规则: 失败大声喊 — 阻断项 exit code 1,明确区分 passed/failed
# 遵守规则: 规则自证 — 以上注释映射规则原文
