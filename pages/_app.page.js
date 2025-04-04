import "@styles/globals.scss";
import App from "@components/App";
import { useState } from "react";

const LiveChartApp = ({ Component, pageProps, domainName }) => {
  const [_domainName, _setDomainName] = useState(domainName);

  return (
    <App
      Component={Component}
      pageProps={pageProps}
      domainName={_domainName}
    />
  );
};

export default LiveChartApp;