# 旁路 Caddy：反代到主体容器 lanius-app（compose 服务名）。
# QQ 回调 /qq/* → bot(8788)；/api/lanius/* → api(8787)；其余 → web(8790)。
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
