#!/usr/bin/env python3
"""通过 ~/.ssh/lanius.env 连接生产机执行命令 / 上传文件（密码不进仓库）。"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import paramiko


def load_env(path: Path) -> dict[str, str]:
    """读取 KEY=VALUE 环境文件。"""
    data: dict[str, str] = {}
    # utf-8-sig：兼容 PowerShell 写出的 BOM
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        data[key.strip()] = value.strip()
    return data


def connect() -> paramiko.SSHClient:
    """使用 lanius.env 建立 SSH 连接（优先密钥，失败则密码）。"""
    env_path = Path.home() / ".ssh" / "lanius.env"
    if not env_path.is_file():
        raise SystemExit(f"missing {env_path}")
    cfg = load_env(env_path)
    host = cfg["LANIUS_SSH_HOST"]
    port = int(cfg.get("LANIUS_SSH_PORT", "22"))
    user = cfg.get("LANIUS_SSH_USER", "root")
    password = cfg.get("LANIUS_SSH_PASSWORD", "")
    key_path = Path.home() / ".ssh" / "id_ed25519_lanius"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        if key_path.is_file():
            client.connect(
                hostname=host,
                port=port,
                username=user,
                key_filename=str(key_path),
                timeout=30,
                allow_agent=False,
                look_for_keys=False,
            )
            return client
    except Exception:
        client.close()
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    client.connect(
        hostname=host,
        port=port,
        username=user,
        password=password,
        timeout=30,
        allow_agent=False,
        look_for_keys=False,
    )
    return client


def run(client: paramiko.SSHClient, command: str, timeout: int = 3600) -> int:
    """执行远程命令并流式打印输出。"""
    print(f"$ {command}", flush=True)
    stdin, stdout, stderr = client.exec_command(command, timeout=timeout)
    while True:
        line = stdout.readline()
        if not line:
            break
        sys.stdout.write(line)
        sys.stdout.flush()
    err = stderr.read().decode("utf-8", errors="replace")
    if err:
        sys.stderr.write(err)
        sys.stderr.flush()
    return stdout.channel.recv_exit_status()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", nargs="?", help="远程 shell 命令")
    parser.add_argument("--upload", nargs=2, metavar=("LOCAL", "REMOTE"), help="SFTP 上传")
    parser.add_argument("--install-key", action="store_true", help="安装本机 ed25519 公钥")
    args = parser.parse_args()

    client = connect()
    try:
        if args.install_key:
            pub = (Path.home() / ".ssh" / "id_ed25519_lanius.pub").read_text(encoding="utf-8").strip()
            script = (
                "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
                f"grep -qxF '{pub}' ~/.ssh/authorized_keys 2>/dev/null || "
                f"echo '{pub}' >> ~/.ssh/authorized_keys && "
                "chmod 600 ~/.ssh/authorized_keys && echo key-ok"
            )
            code = run(client, script, timeout=60)
            raise SystemExit(code)

        if args.upload:
            local, remote = args.upload
            sftp = client.open_sftp()
            sftp.put(local, remote)
            sftp.close()
            print(f"uploaded {local} -> {remote}", flush=True)

        if args.command:
            raise SystemExit(run(client, args.command))
    finally:
        client.close()


if __name__ == "__main__":
    main()
