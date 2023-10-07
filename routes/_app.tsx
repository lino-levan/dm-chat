import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DM</title>
      </head>
      <body class="bg-black w-screen h-screen flex flex-col p-2 text-white">
        <Component />
      </body>
    </html>
  );
}
