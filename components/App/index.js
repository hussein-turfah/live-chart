const MyApp = ({ Component, pageProps, domainName }) => {

  return (
    <div>
      <Component
        key={"pageContent"}
        {...pageProps}
        domainName={domainName}
      />
    </div>
  );
};

export default MyApp;
