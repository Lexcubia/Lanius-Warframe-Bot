# 旁路 Caddy：反代到主体容器 lanius-app（compose 服务名）。
{$DOMAIN:localhost} {
	encode gzip

	handle /qq/* {
		reverse_proxy lanius-app:8788
	}

	handle /api/lanius/* {
		uri strip_prefix /api/lanius
		reverse_proxy lanius-app:8787
	}

	handle {
		reverse_proxy lanius-app:8790
	}
}
