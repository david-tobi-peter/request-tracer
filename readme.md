# Request Tracer

A lightweight Node.js tool to trace network requests and measure timings across **DNS**, **TCP**, **TLS**, and **HTTP**. Can be used as a **CLI tool** or imported as a **package** in your project.

---

## Requirements

- Node.js: 18.0.0 or higher
- Module System: ESM only ("type": "module" in package.json)

## Migration from CommonJS

If your project uses CommonJS, you need to migrate to ESM:

- Add "type": "module" to your package.json
- Change require() to import
- Change module.exports to export
- Use .js extensions in relative imports
- Update your tsconfig.json:

---

## Features

- Trace URL requests end-to-end
- Measures:
  - DNS resolution
  - TCP connection
  - TLS handshake (HTTPS)
  - HTTP time-to-first-byte and download
- Supports HTTP and HTTPS
- Optional request timeout
- Exposes detailed `ITraceResult` for programmatic use
- CLI friendly

---

## Installation

```bash
# Using npm
npm install -g @david-tobi-peter/request-tracer

# Or local project
npm install @david-tobi-peter/request-tracer
````

---

## Usage

### CLI

```bash
# Basic usage
request-tracer --url https://example.com

# With timeout (ms)
request-tracer --url https://example.com --timeout 5000
```

**Example Output:**

```
Tracing: https://example.com/

DNS:       7.39 ms → 172.217.14.206 (ipv4)
TCP:       12.54 ms → local:52345 remote:443
TLS:       35.67 ms → TLSv1.3 / TLS_AES_256_GCM_SHA384
ALPN:      http/1.1 | Session reused: false
Cert:      Google Trust Services
HTTP:      101.45 ms TTFB + 2.34 ms download
Status:    200 OK (HTTP/1.1)
Bytes:     1.23 KB

Total time: 159.39 ms
```

---

### Programmatic Usage

```ts
import { RequestTracer, ITraceResult } from "@david-tobi-peter/request-tracer";

const tracer = new RequestTracer();

async function run() {
  const result: ITraceResult = await tracer.trace("https://example.com");

  // or const result: ITraceResult = await tracer.trace("https://example.com", 5000);
  console.log(result);
}

run();
```

**ITraceResult Shape:**

```ts
interface ITraceResult {
  url: URL;
  dns: { time: number; address: string; family: "ipv4" | "ipv6" };
  tcp: { time: number; localPort: number; remotePort: number; socket: Socket };
  tls?: {
    time: number;
    protocol: string;
    cipher: string;
    alpn: string;
    sessionReused: boolean;
    certIssuer: string;
    socket: TLSSocket;
  };
  http: {
    ttfb: number;
    download: number;
    statusCode: number | string;
    statusMessage: string;
    httpVersion: string;
    headers: Record<string, string | string[]>;
    bytes: number;
  };
  totalTime: number;
}
```

* All times are in **milliseconds**
* `timeoutMs` defaults to **3000 ms** if not specified

---

## Options

| Option      | Description                     | Default |
| ----------- | ------------------------------- | ------- |
| `--url`     | URL to trace (required)         | —       |
| `--timeout` | Request timeout in milliseconds | 3000    |

---

## Development

```bash
# Build project
npm run build

# Run CLI with tsx
npm run tracer -- --url https://example.com
```

---

## License

MIT License – see [LICENSE](./license)

---
