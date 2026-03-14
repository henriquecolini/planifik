import React from "react";
import Image from "next/image";

export interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const NubankLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/nubank.svg" alt="Nubank"></Image>
);

export const ItauLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/itau.svg" alt="Itau"></Image>
);

export const InterLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/inter.svg" alt="Inter"></Image>
);

export const CaixaLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/caixa.svg" alt="Caixa"></Image>
);

export const C6Logo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/c6.svg" alt="C6"></Image>
);

export const BradescoLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/bradesco.svg" alt="Bradesco"></Image>
);

export const SantanderLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/santander.svg" alt="Santander"></Image>
);

export const BTGLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/btg.svg" alt="BTG"></Image>
);

export const SicoobLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/sicoob.svg" alt="Sicoob"></Image>
);

export const SafraLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/safra.svg" alt="Safra"></Image>
);

export const PicPayLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/picpay.svg" alt="PicPay"></Image>
);

export const MercadoPagoLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/mercadopago.svg" alt="Mercado Pago"></Image>
);

export const PagBankLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/pagbank.svg" alt="PagBank"></Image>
);

export const PanLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/pan.svg" alt="Pan"></Image>
);

export const NeonLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/neon.svg" alt="Neon"></Image>
);

export const NextLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/next.svg" alt="Next"></Image>
);

export const CarrefourLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/carrefour.svg" alt="Carrefour"></Image>
);

export const GenericLogo = (props: LogoProps) => (
  <Image {...props} src="/icons/banks/generic.svg" alt="Generic"></Image>
);

export function getBankLogo(slug: string, props: LogoProps) {
  props = { width: 32, height: 32, ...props };
  switch (slug) {
    case "nubank":
      return <NubankLogo {...props} />;
    case "itau":
      return <ItauLogo {...props} />;
    case "inter":
      return <InterLogo {...props} />;
    case "caixa":
      return <CaixaLogo {...props} />;
    case "c6":
      return <C6Logo {...props} />;
    case "bradesco":
      return <BradescoLogo {...props} />;
    case "santander":
      return <SantanderLogo {...props} />;
    case "btg":
      return <BTGLogo {...props} />;
    case "sicoob":
      return <SicoobLogo {...props} />;
    case "safra":
      return <SafraLogo {...props} />;
    case "picpay":
      return <PicPayLogo {...props} />;
    case "mercadopago":
      return <MercadoPagoLogo {...props} />;
    case "pagbank":
      return <PagBankLogo {...props} />;
    case "pan":
      return <PanLogo {...props} />;
    case "neon":
      return <NeonLogo {...props} />;
    case "next":
      return <NextLogo {...props} />;
    case "carrefour":
      return <CarrefourLogo {...props} />;
    case "generic":
      return <GenericLogo {...props} />;
    default:
      return null;
  }
}
