import { ScrollViewStyleReset } from "expo-router/html";
import { type PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Vault Breaker</title>
        <ScrollViewStyleReset />
        <style>{`
          html, body, #root {
            height: 100%;
            background-color: #0a0e17;
            margin: 0;
            padding: 0;
            user-select: none;
            -webkit-user-select: none;
          }
          * {
            box-sizing: border-box;
          }
          ::-webkit-scrollbar {
            width: 4px;
          }
          ::-webkit-scrollbar-track {
            background: #0a0e17;
          }
          ::-webkit-scrollbar-thumb {
            background: #1a2e3a;
            border-radius: 2px;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
