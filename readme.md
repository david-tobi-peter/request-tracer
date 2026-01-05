# Request Tracer

A lightweight Node.js tool to trace network requests and measure timings across **DNS**, **TCP**, **TLS**, and **HTTP**.  
Can be used as a **CLI tool** or imported as a **package** in your project.

---

## Requirements

- **Node.js:** 18.0.0 or higher
- **Module System:** ESM only (`"type": "module"` in `package.json`)

---

## Migration from CommonJS

If your project uses CommonJS, you must migrate to ESM:

- Add `"type": "module"` to your `package.json`
- Replace `require()` with `import`
- Replace `module.exports` with `export`
- Use explicit `.js` extensions in relative imports
- Update your `tsconfig.json` accordingly

---

## Features

- End-to-end request tracing
- Measures:
  - DNS resolution
  - TCP connection
  - TLS handshake (HTTPS)
  - HTTP time-to-first-byte (TTFB) and download time
- Supports HTTP and HTTPS
- Optional request timeout
- Supports custom HTTP methods, headers, and body
- Exposes detailed `ITraceResult` for programmatic use
- CLI-friendly and scriptable

---

## Installation

```bash
# Global install (CLI)
npm install -g @david-tobi-peter/request-tracer

# Or local project dependency
npm install @david-tobi-peter/request-tracer
````

---

## Usage

### CLI

```bash
# Basic GET request
request-tracer --url https://example.com

# With timeout (ms)
request-tracer --url https://example.com --timeout 5000
```

### POST request with body

```bash
request-tracer --url https://api.example.com/users \
  --method POST \
  --body '{"name":"John"}'
```

### Custom headers

> **Note:** `--header` values must be quoted to avoid shell brace expansion.

```bash
request-tracer --url https://api.example.com/data \
  --header '{Authorization:BearerToken,X-Env:prod}'
```

---

### Example Output

```
Tracing: GET https://example.com/

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

## Programmatic Usage

```ts
import { RequestTracer, ITraceResult } from "@david-tobi-peter/request-tracer";

const tracer = new RequestTracer();

async function run() {
  // Simple GET request
  const result: ITraceResult = await tracer.trace("https://example.com", 5000);
  console.log(result);

  /*
  // POST request with headers and body
  const postResult: ITraceResult = await tracer.trace(
    "https://api.example.com/users",
    5000,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "BearerToken",
      },
      body: JSON.stringify({ name: "John" }),
    }
  );

  console.log(postResult);
  */
}

run();
```

---

## `ITraceResult` Shape

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
* `timeoutMs` defaults to **30,000 ms** if not specified

---

## CLI Options

| Option      | Description                                     | Default |
| ----------- | ----------------------------------------------- | ------- |
| `--url`     | URL to trace (required)                         | —       |
| `--timeout` | Request timeout in milliseconds                 | 30000   |
| `--method`  | HTTP method                                     | GET     |
| `--header`  | HTTP headers in `{k1:v1,k2:v2}` format (quoted) | —       |
| `--body`    | Request body (POST / PUT / PATCH)               | —       |

---

## License

MIT License – see [LICENSE](./license.md)
