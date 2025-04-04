import styles from "./index.module.scss";

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
