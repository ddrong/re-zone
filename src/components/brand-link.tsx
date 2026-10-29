import Image from 'next/image';
import Link from 'next/link';
export function BrandLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={'brand brand-wordmark ' + className}
      aria-label="정비ON AI 홈"
    >
      <Image
        src="/assets/jeongbion-logo-transparent.png"
        alt="정비ON"
        width={2172}
        height={724}
        priority
      />
    </Link>
  );
}
