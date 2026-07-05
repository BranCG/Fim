'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import api, { formatCLP, clearSession, getSession, roundCLP } from '@/lib/api';
import { connectSocket, forceReconnectSocket } from '@/lib/socket';
import { sendLocalNotification, initializePushNotifications } from '@/lib/notifications';

const DriverMap = dynamic(() => import('@/components/map/DriverMap'), { ssr: false });
import BiometricModal from '@/components/BiometricModal';
import FinancesDashboard from '@/components/FinancesDashboard';

type DriverStatus = 'pending' | 'approved' | 'active' | 'rejected' | 'suspended';

interface TripRequest {
  id: string;
  originLat: number; originLng: number; originAddress: string;
  destLat: number; destLng: number; destAddress: string;
  stops?: any[];
  distanceKm: number; durationMin: number; estimatedPrice: number;
  paymentMethod: string;
  passenger: { id: string; name: string; phone: string };
  driverDistance: number;
  passengerCount?: number;
}

interface DriverInfo {
  id: string; name: string; status: DriverStatus;
  membershipPaid: boolean; isOnline: boolean;
  membershipPlan: 'BLACK' | 'COMFORT' | 'FLEX';
  membershipProgress: number;
  membershipGoal: number;
  membershipExpiresAt?: string;
  dailyCashTripsCount: number;
  comfortDebt?: number;
  comfortLastPaidAt?: string;
  vehicleBrand: string; vehicleModel: string; vehiclePlate: string;
  totalRating: number; totalTrips: number;
  mercadoPagoLink: string | null;
  email: string;
  walletBalance: number;
  adminNotes: string | null;
  isPromoActive?: boolean;
  freePassDays?: number;
  createdAt: string;
  isTrial?: boolean;
  nextDiscount?: number;
  selfieUrl?: string;
  giftDaysPending?: number;
}

const IconCheck = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

const SANTIAGO = { lat: -33.4489, lng: -70.6693 };

// --- ICONOS SVG ---
const IconClock = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

const IconLogout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>;

const IconUser = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

const IconShieldLock = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Shield-Lock--Streamline-Ultimate" height={size} width={size}>
    <desc>
      Shield Lock Streamline Icon: https://streamlinehq.com
    </desc>
    <path fill="#e3e3e3" d="M1.95703 4.13347V11.438c0.02797 2.4137 0.7971 4.7604 2.20322 6.7224 1.40613 1.9619 3.38129 3.4443 5.65797 4.2463l1.07218 0.396c0.7163 0.2631 1.5027 0.2631 2.219 0l1.0722 -0.396c2.2765 -0.8022 4.2516 -2.2847 5.6576 -4.2466 1.4061 -1.9619 2.1754 -4.3085 2.2036 -6.7221V4.13347c-0.0008 -0.28701 -0.0859 -0.56745 -0.2448 -0.80652 -0.1588 -0.23907 -0.3843 -0.42624 -0.6485 -0.53827 -2.8974 -1.2093 -6.0101 -1.817476 -9.1496 -1.78763 -3.13942 -0.029846 -6.2522 0.57833 -9.14953 1.78763 -0.26417 0.11213 -0.48963 0.29933 -0.64842 0.53837 -0.1588 0.23905 -0.24396 0.51944 -0.24492 0.80642Z" strokeWidth="1" />
    <path fill="#ffffff" d="M11.9999 1.00105c-3.13942 -0.029846 -6.2522 0.57833 -9.14953 1.78763 -0.26417 0.11213 -0.48963 0.29933 -0.64842 0.53837 -0.1588 0.23905 -0.24396 0.51944 -0.24492 0.80642V11.438c0.02797 2.4137 0.7971 4.7604 2.20322 6.7224 1.40613 1.9619 3.38129 3.4443 5.65797 4.2463l1.07218 0.396c0.3558 0.1301 0.7308 0.1971 1.1095 0.1971V1.00105Z" strokeWidth="1" />
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1.95703 4.13347V11.438c0.02797 2.4137 0.7971 4.7604 2.20322 6.7224 1.40613 1.9619 3.38129 3.4443 5.65797 4.2463l1.07218 0.396c0.7163 0.2631 1.5027 0.2631 2.219 0l1.0722 -0.396c2.2765 -0.8022 4.2516 -2.2847 5.6576 -4.2466 1.4061 -1.9619 2.1754 -4.3085 2.2036 -6.7221V4.13347c-0.0008 -0.28701 -0.0859 -0.56745 -0.2448 -0.80652 -0.1588 -0.23907 -0.3843 -0.42624 -0.6485 -0.53827 -2.8974 -1.2093 -6.0101 -1.817476 -9.1496 -1.78763 -3.13942 -0.029846 -6.2522 0.57833 -9.14953 1.78763 -0.26417 0.11213 -0.48963 0.29933 -0.64842 0.53837 -0.1588 0.23905 -0.24396 0.51944 -0.24492 0.80642Z" strokeWidth="1" />
    <path fill="#ffef5e" d="M15.3475 9.3634H8.65227c-0.12561 0 -0.24998 0.02474 -0.36603 0.07281 -0.11604 0.04807 -0.22148 0.11852 -0.3103 0.20734 -0.08881 0.08881 -0.15927 0.19425 -0.20733 0.31029 -0.04807 0.11606 -0.07281 0.24046 -0.07281 0.36606v5.7378c0 0.2537 0.10077 0.497 0.28014 0.6763 0.17937 0.1794 0.42266 0.2802 0.67633 0.2802h6.69523c0.2537 0 0.497 -0.1008 0.6763 -0.2802 0.1794 -0.1793 0.2802 -0.4226 0.2802 -0.6763v-5.7378c0 -0.2537 -0.1008 -0.49698 -0.2802 -0.67635 -0.1793 -0.17938 -0.4226 -0.28015 -0.6763 -0.28015Z" strokeWidth="1" />
    <path fill="#fff9bf" d="M11.9999 9.3634H8.65227c-0.12561 0 -0.24998 0.02474 -0.36603 0.07281 -0.11604 0.04807 -0.22148 0.11852 -0.3103 0.20734 -0.08881 0.08881 -0.15927 0.19425 -0.20733 0.31029 -0.04807 0.11606 -0.07281 0.24046 -0.07281 0.36606v5.7388c0 0.2536 0.10077 0.4969 0.28014 0.6763s0.42266 0.2801 0.67633 0.2801h3.34763V9.3634Z" strokeWidth="1" />
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3475 9.3634H8.65227c-0.12561 0 -0.24998 0.02474 -0.36603 0.07281 -0.11604 0.04807 -0.22148 0.11852 -0.3103 0.20734 -0.08881 0.08881 -0.15927 0.19425 -0.20733 0.31029 -0.04807 0.11606 -0.07281 0.24046 -0.07281 0.36606v5.7378c0 0.2537 0.10077 0.497 0.28014 0.6763 0.17937 0.1794 0.42266 0.2802 0.67633 0.2802h6.69523c0.2537 0 0.497 -0.1008 0.6763 -0.2802 0.1794 -0.1793 0.2802 -0.4226 0.2802 -0.6763v-5.7378c0 -0.2537 -0.1008 -0.49698 -0.2802 -0.67635 -0.1793 -0.17938 -0.4226 -0.28015 -0.6763 -0.28015Z" strokeWidth="1" />
    <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.9998 14.4451c0.3171 0 0.6212 -0.126 0.8454 -0.3502 0.2242 -0.2242 0.3502 -0.5283 0.3502 -0.8454 0 -0.3171 -0.126 -0.6212 -0.3502 -0.8454 -0.2242 -0.2242 -0.5283 -0.3502 -0.8454 -0.3502 -0.3171 0 -0.6212 0.126 -0.8454 0.3502 -0.2242 0.2242 -0.3502 0.5283 -0.3502 0.8454 0 0.3171 0.126 0.6212 0.3502 0.8454 0.2242 0.2242 0.5283 0.3502 0.8454 0.3502Z" strokeWidth="1" />
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M14.3912 7.9287c0 -0.63418 -0.2519 -1.24238 -0.7003 -1.69081 -0.4485 -0.44843 -1.0567 -0.70035 -1.6909 -0.70035 -0.6341 0 -1.2423 0.25192 -1.6908 0.70035 -0.44839 0.44843 -0.70031 1.05663 -0.70031 1.69081v1.4347h4.78231V7.9287Z" strokeWidth="1" />
  </svg>
);
const IconCompass = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 8.88 9.88 16.24 7.76" />
  </svg>
);

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);



const IconProfileColor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="36" width="36" style={{ flexShrink: 0 }}>
    <path fill="#c77f67" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m23 15.3478 -0.8025 -4.0174c-0.0442 -0.2162 -0.1617 -0.4105 -0.3327 -0.5499 -0.171 -0.1395 -0.385 -0.2155 -0.6057 -0.2153H2.74087c-0.22067 -0.0002 -0.43465 0.0758 -0.60566 0.2153 -0.17102 0.1394 -0.28855 0.3337 -0.33269 0.5499L1 15.3478v3.8261h22v-3.8261Z" strokeWidth={1}></path>
    <path fill="#ffef5e" d="M20.13 17.7391V5.78261h-9.0315c-0.3087 0.01028 -0.6138 -0.06919 -0.8783 -0.22877 -0.26451 -0.15959 -0.47707 -0.39244 -0.61193 -0.67036 -0.12736 -0.30061 -0.34041 -0.55706 -0.61257 -0.73737 -0.27216 -0.1803 -0.59139 -0.27649 -0.91786 -0.27654H4.3474c-0.12684 0 -0.24849 0.05039 -0.33818 0.14008 -0.08969 0.08969 -0.14008 0.21134 -0.14008 0.33818V17.7391" strokeWidth={1}></path>
    <path fill="#fff9bf" d="M11.0985 5.78261c-0.3087 0.01028 -0.6138 -0.06919 -0.8783 -0.22877 -0.26451 -0.15959 -0.47707 -0.39244 -0.61193 -0.67036 -0.12736 -0.30061 -0.34041 -0.55706 -0.61257 -0.73737 -0.27216 -0.1803 -0.59139 -0.27649 -0.91786 -0.27654H4.3474c-0.12684 0 -0.24849 0.05039 -0.33818 0.14008 -0.08969 0.08969 -0.14008 0.21134 -0.14008 0.33818V17.7391h1.1287L16.9544 5.78261h-5.8559Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M20.13 13.4348V5.78261h-9.0315c-0.3087 0.01028 -0.6138 -0.06919 -0.8783 -0.22877 -0.26451 -0.15959 -0.47707 -0.39244 -0.61193 -0.67036 -0.12736 -0.30061 -0.34041 -0.55706 -0.61257 -0.73737 -0.27216 -0.1803 -0.59139 -0.27649 -0.91786 -0.27654H4.3474c-0.12684 0 -0.24849 0.05039 -0.33818 0.14008 -0.08969 0.08969 -0.14008 0.21134 -0.14008 0.33818v9.08697" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M18.219 3.86956h-6.1753c-0.3159 -0.00015 -0.6252 -0.09017 -0.8918 -0.25954 -0.2666 -0.16938 -0.4795 -0.41112 -0.6138 -0.69699 -0.1341 -0.28527 -0.3464 -0.52662 -0.61222 -0.69595 -0.26585 -0.16934 -0.57433 -0.2597 -0.88953 -0.26057H5.78418" strokeWidth={1}></path>
    <path fill="#ffdda1" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0001 11.0435c0.4439 0 0.8697 -0.1764 1.1836 -0.4903 0.3139 -0.3139 0.4903 -0.73969 0.4903 -1.18364 0 -0.44395 -0.1764 -0.86971 -0.4903 -1.18363s-0.7397 -0.49028 -1.1836 -0.49028c-0.444 0 -0.8697 0.17636 -1.1837 0.49028 -0.3139 0.31392 -0.4902 0.73968 -0.4902 1.18363 0 0.44395 0.1763 0.86974 0.4902 1.18364 0.314 0.3139 0.7397 0.4903 1.1837 0.4903Z" strokeWidth={1}></path>
    <path fill="#66e1ff" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.349 14.3913c-0.1897 -0.7439 -0.6218 -1.4035 -1.228 -1.8745 -0.6063 -0.4711 -1.3521 -0.7268 -2.1199 -0.7268 -0.7677 0 -1.5135 0.2557 -2.11977 0.7268 -0.60624 0.471 -1.03831 1.1306 -1.22801 1.8745H15.349Z" strokeWidth={1}></path>
    <path fill="#e3bfb3" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M18.2174 15.3478c-0.1917 -0.0002 -0.3815 0.0381 -0.5582 0.1125 -0.1767 0.0745 -0.3367 0.1836 -0.4704 0.3209 -0.1338 0.1374 -0.2387 0.3001 -0.3084 0.4787 -0.0698 0.1786 -0.103 0.3693 -0.0978 0.561 -0.013 0.3828 -0.1773 0.7448 -0.4568 1.0066 -0.2796 0.2618 -0.6516 0.402 -1.0344 0.3899H8.70765c-0.38266 0.0119 -0.75441 -0.1285 -1.03376 -0.3902 -0.27935 -0.2618 -0.44352 -0.6237 -0.4565 -1.0063 0.00511 -0.1916 -0.02822 -0.3823 -0.09803 -0.5608 -0.06982 -0.1786 -0.17469 -0.3413 -0.30844 -0.4786 -0.13374 -0.1373 -0.29364 -0.2464 -0.47026 -0.3209 -0.17662 -0.0745 -0.36637 -0.1128 -0.55805 -0.1128H1v5.7392c0 0.2537 0.10078 0.497 0.28016 0.6763 0.17938 0.1794 0.42268 0.2802 0.67636 0.2802H22.0435c0.2537 0 0.497 -0.1008 0.6763 -0.2802 0.1794 -0.1793 0.2802 -0.4226 0.2802 -0.6763v-5.7392h-4.7826Z" strokeWidth={1}></path>
  </svg>
);

const IconWalletColor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="36" width="36" style={{ flexShrink: 0 }}>
    <path fill="#5f63d9" d="M1.95652 9.60869V4.82607c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h18.174c0.2537 0 0.497 0.10078 0.6763 0.28016 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v3.82603H1.95652v1.00659Z" strokeWidth={1}></path>
    <path fill="#9396ff" d="M22.0435 8.65207v10.52173c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1794 -0.4226 0.2802 -0.6763 0.2802h-18.174c-0.25369 0 -0.49698 -0.1008 -0.67637 -0.2802 -0.17937 -0.1794 -0.28015 -0.4227 -0.28015 -0.6764V8.65207h20.087Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.0435 8.65216v10.52174c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1794 -0.4226 0.2802 -0.6763 0.2802h-18.174c-0.25369 0 -0.49698 -0.1008 -0.67637 -0.2802 -0.17937 -0.1794 -0.28015 -0.4227 -0.28015 -0.6764V4.82607c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h18.174c0.2537 0 0.497 0.10078 0.6763 0.28016 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v3.82609Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1 8.65216h22" strokeWidth={1}></path>
    <path fill="#5f63d9" d="M23 15.3478c0 1.0566 -0.8564 1.9131 -1.913 1.9131h-4.7827c-1.0566 0 -1.913 -0.8565 -1.913 -1.9131s0.8564 -1.913 1.913 -1.913h4.7827c1.0566 0 1.913 0.8564 1.913 1.913Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.0435 17.2609H16.3043c-1.0565 0 -1.913 -0.8565 -1.913 -1.9131s0.8565 -1.913 1.913 -1.913h5.7392" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M18.2174 15.3478h0.01" strokeWidth={1}></path>
  </svg>
);

const IconLinkColor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="36" width="36" style={{ flexShrink: 0 }}>
    <path fill="#ffef5e" d="M12.4783 17.2609h2.8695c0.5074 0 0.994 -0.2016 1.3528 -0.5604 0.3588 -0.3587 0.5603 -0.8454 0.5603 -1.3526v-6.6957c0 -0.5072 -0.2015 -0.99387 -0.5603 -1.35267 -0.3588 -0.35879 -0.8454 -0.56038 -1.3528 -0.56038h-2.8695c-0.5073 0 -0.994 0.20159 -1.3528 0.56038 -0.3587 0.3588 -0.5602 0.84547 -0.5602 1.35267V9.6087c0 0.25369 -0.1008 0.49698 -0.2802 0.67637 -0.1794 0.17939 -0.4226 0.28015 -0.6763 0.28015H7.69565c-0.25369 0 -0.49698 0.10078 -0.67636 0.28015C6.8399 11.0248 6.73913 11.2681 6.73913 11.5217V15.3478c0 0.5072 0.20157 0.9939 0.56038 1.3526 0.35881 0.3588 0.84547 0.5605 1.35266 0.5605h3.82613Z" strokeWidth={1}></path>
    <path fill="#e3e3e3" d="M12.4783 17.2609c-0.2537 0 -0.497 0.1008 -0.6764 0.2802 -0.1793 0.1793 -0.2801 0.4226 -0.2801 0.6763v1.9131c0 0.5072 -0.2016 0.9939 -0.5604 1.3527 -0.3588 0.3588 -0.8455 0.5604 -1.3527 0.5604h-2.8695c-0.5073 0 -0.994 -0.2016 -1.3528 -0.5604 -0.3588 -0.3588 -0.5603 -0.8455 -0.5603 -1.3527V13.4348c0 -0.5073 0.2015 -0.9939 0.5603 -1.3527 0.3588 -0.3588 0.8455 -0.5604 1.3528 -0.5604h1.913c0.2537 0 0.497 -0.1008 0.6764 -0.2802 0.1794 -0.1794 0.2802 -0.4227 0.2802 -0.6763V8.65217c0 -0.25369 -0.1008 -0.49698 -0.2802 -0.67636 -0.1794 -0.17939 -0.4227 -0.28016 -0.6764 -0.28016h-1.913c-1.0145 0 -1.98751 0.403 -2.70487 1.12036C2.40301 9.53337 2 10.5064 2 11.5209v8.6087c0 1.0145 0.40301 1.9875 1.12038 2.7049C3.83774 23.5518 4.81075 23.9548 5.82522 23.9548h6.69568c0.2537 0 0.497 -0.1008 0.6764 -0.2801 0.1793 -0.1794 0.2801 -0.4227 0.2801 -0.6764v-5.7374Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.4783 17.2609c-0.2537 0 -0.497 0.1008 -0.6764 0.2802 -0.1793 0.1793 -0.2801 0.4226 -0.2801 0.6763v1.9131c0 0.5072 -0.2016 0.9939 -0.5604 1.3527 -0.3588 0.3588 -0.8455 0.5604 -1.3527 0.5604h-2.8695c-0.5073 0 -0.994 -0.2016 -1.3528 -0.5604 -0.3588 -0.3588 -0.5603 -0.8455 -0.5603 -1.3527V13.4348c0 -0.5073 0.2015 -0.9939 0.5603 -1.3527 0.3588 -0.3588 0.8455 -0.5604 1.3528 -0.5604h1.913c0.2537 0 0.497 -0.1008 0.6764 -0.2802 0.1794 -0.1794 0.2802 -0.4227 0.2802 -0.6763V8.65217c0 -0.25369 -0.1008 -0.49698 -0.2802 -0.67636 -0.1794 -0.17939 -0.4227 -0.28016 -0.6764 -0.28016h-1.913c-1.0145 0 -1.98751 0.403 -2.70487 1.12036C2.40301 9.53337 2 10.5064 2 11.5209v8.6087c0 1.0145 0.40301 1.9875 1.12038 2.7049C3.83774 23.5518 4.81075 23.9548 5.82522 23.9548h2.86958c1.0144 0 1.9874 -0.403 2.7048 -1.1203 0.7173 -0.7174 1.1204 -1.6904 1.1204 -2.7049v-1.9131c0 -0.2536 -0.1008 -0.4969 -0.2802 -0.6763 -0.1794 -0.1794 -0.4227 -0.2802 -0.6764 -0.2802Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.5217 6.73913c0.2537 0 0.497 -0.10078 0.6764 -0.28016C12.3775 6.27958 12.4783 6.03629 12.4783 5.7826V3.86956c0 -0.50725 0.2016 -0.99387 0.5604 -1.35266 0.3588 -0.35879 0.8455 -0.56038 1.3527 -0.56038h2.8695c0.5074 0 0.994 0.20159 1.3528 0.56038 0.3588 0.35879 0.5603 0.84541 0.5603 1.35266V10.5652c0 0.5073 -0.2015 0.9939 -0.5603 1.3527 -0.3588 0.3588 -0.8454 0.5604 -1.3528 0.5604h-1.913c-0.2537 0 -0.497 0.1008 -0.6764 0.2802 -0.1794 0.1794 -0.2802 0.4226 -0.2802 0.6763v1.9131c0 0.2536 0.1008 0.4969 0.2802 0.6763 0.1794 0.1794 0.4227 0.2802 0.6764 0.2802h1.913c1.0144 0 1.9874 -0.403 2.7048 -1.1204 0.7173 -0.7173 1.1204 -1.6904 1.1204 -2.7048V3.86956c0 -1.01449 -0.4031 -1.98751 -1.1204 -2.70487C21.3653 0.447334 20.3923 0.0443115 19.3778 0.0443115h-2.8695c-1.0145 0 -1.9875 0.4030225 -2.7049 1.1203785 -0.7174 0.71736 -1.1204 1.69038 -1.1204 2.70487v1.91304c0 0.25369 0.1008 0.49698 0.2802 0.67637 0.1794 0.17939 0.4227 0.28016 0.6764 0.28016h-1.1179Z" strokeWidth={1}></path>
    <path fill="#5f63d9" d="M15.3478 11.5217H8.65217c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2801 -0.17938 -0.1794 -0.28016 -0.4227 -0.28016 -0.6764 0 -0.2537 0.10078 -0.497 0.28016 -0.6764 0.17938 -0.1794 0.42267 -0.2802 0.67636 -0.2802h6.69563c0.2537 0 0.497 0.1008 0.6764 0.2802 0.1794 0.1794 0.2801 0.4227 0.2801 0.6764 0 0.2537 -0.1007 0.497 -0.2801 0.6764 -0.1794 0.1793 -0.4227 0.2801 -0.6764 0.2801Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.65217 11.5217h6.69563" strokeWidth={1}></path>
  </svg>
);

const IconCheckColor = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" height="36" width="36" style={{ flexShrink: 0 }}>
    <path fill="#ffdda1" d="M21.1498 17.6865c0.0664 -0.1327 0.1009 -0.2791 0.1009 -0.4275 0 -0.1485 -0.0345 -0.2948 -0.1009 -0.4276l-0.4936 -0.9891c-0.0751 -0.1505 -0.1092 -0.3182 -0.0988 -0.4861 0.0104 -0.168 0.065 -0.3302 0.1581 -0.4704l0.2946 -0.4419c0.1049 -0.1571 0.1608 -0.3418 0.1608 -0.5308 0 -0.189 -0.0559 -0.3738 -0.1608 -0.5309l-0.6026 -0.9039h-7.8291l-0.6035 -3.94089 -1.0886 0.72505c-0.3434 0.2293 -0.6331 0.53015 -0.8494 0.88194l-3.15648 5.1279c-0.22241 0.361 -0.55906 0.6374 -0.95652 0.7853l-3.21199 1.2033v4.7826c0 0.2536 0.10078 0.497 0.28017 0.6763 0.17937 0.1794 0.42267 0.2802 0.67635 0.2802h5.73912l1.88145 -0.7518c0.3381 -0.135 0.6987 -0.2045 1.0627 -0.2047h7.0993l1.0158 -1.0187c0.1258 -0.1254 0.2142 -0.2834 0.2552 -0.4563 0.0411 -0.1728 0.0332 -0.3536 -0.0227 -0.5223l-0.1674 -0.4983c-0.0799 -0.2407 -0.061 -0.5031 0.0526 -0.7298l0.5653 -1.1316Z" strokeWidth={1}></path>
    <path fill="#ffdda1" d="M20.5328 19.5479c-0.0069 -0.0347 -0.0114 -0.0699 -0.0134 -0.1052 -7.8721 0.7652 -14.07228 -0.8666 -9.2973 -10.40406l-0.3358 0.22478c-0.3435 0.22867 -0.6334 0.52925 -0.8494 0.88098l-3.15648 5.1279c-0.22302 0.3605 -0.55947 0.6367 -0.95652 0.7853l-3.21199 1.2033v4.7826c0 0.2536 0.10078 0.497 0.28017 0.6763 0.17937 0.1794 0.42267 0.2802 0.67635 0.2802h5.73912l1.88145 -0.7518c0.3381 -0.1351 0.6987 -0.2045 1.0627 -0.2047h7.0993l1.0168 -1.0187c0.1256 -0.1256 0.2138 -0.2836 0.2547 -0.4564 0.0408 -0.1728 0.0328 -0.3536 -0.0232 -0.5221l-0.1665 -0.4984Z" strokeWidth={1}></path>
    <path fill="#e3e3e3" d="M12.5642 12.4782 10.9218 1.63131c-0.008 -0.08005 0.0009 -0.16089 0.026 -0.23729 0.0253 -0.07639 0.0663 -0.14664 0.1204 -0.20616 0.0541 -0.05953 0.1201 -0.10702 0.1938 -0.13938 0.0736 -0.03236 0.1533 -0.048876 0.2337 -0.04847h7.8817c0.0826 0.00005 0.1641 0.0179 0.2392 0.05233 0.075 0.03444 0.1416 0.08464 0.1955 0.1472 0.0538 0.06255 0.0935 0.13599 0.1164 0.21529 0.0229 0.0793 0.0284 0.1626 0.0162 0.24422L18.3195 12.4782h-5.7553Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m12.2767 10.5652 -1.3525 -9.01616c-0.0102 -0.06807 -0.0055 -0.13754 0.0136 -0.20366 0.0191 -0.06612 0.0522 -0.12733 0.0972 -0.17946 0.045 -0.05212 0.1006 -0.09393 0.1633 -0.12257 0.0625 -0.02863 0.1305 -0.04342 0.1994 -0.04335h6.6182" strokeWidth={1}></path>
    <path fill="#78eb7b" d="m14.667 12.4783 -0.9039 -9.03912c-0.0067 -0.06671 0.0007 -0.13408 0.0218 -0.19774 0.021 -0.06367 0.0551 -0.1222 0.1002 -0.17181 0.0451 -0.04961 0.1001 -0.08918 0.1616 -0.11614 0.0613 -0.02698 0.1276 -0.04074 0.1947 -0.0404h6.5684c0.0688 0.00007 0.1367 0.01495 0.1992 0.04365 0.0624 0.02869 0.118 0.07052 0.1629 0.12263 0.0448 0.05211 0.0779 0.11327 0.0969 0.17933 0.0191 0.06605 0.0237 0.13544 0.0135 0.20343l-1.3544 9.01617" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.2778 12.4782h8.1304l0.6026 0.9039c0.1048 0.1572 0.1608 0.342 0.1608 0.5309s-0.056 0.3737 -0.1608 0.5309l-0.2946 0.4419c-0.0932 0.1401 -0.1477 0.3023 -0.1581 0.4703 -0.0105 0.168 0.0237 0.3356 0.0988 0.4862l0.4945 0.989c0.0664 0.1328 0.1009 0.2791 0.1009 0.4276 0 0.1484 -0.0345 0.2948 -0.1009 0.4276l-0.5663 1.1315c-0.1132 0.2268 -0.1318 0.4894 -0.0516 0.7298l0.1664 0.4984c0.0561 0.1685 0.0641 0.3493 0.0233 0.5222 -0.041 0.1727 -0.1292 0.3308 -0.2548 0.4563l-1.0167 1.0187h-7.0993c-0.3651 0 -0.7268 0.0697 -1.0656 0.2056l-1.8786 0.7509" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m2.71191 17.2608 3.21199 -1.2042c0.39762 -0.1495 0.73414 -0.4272 0.95652 -0.7892l3.15648 -5.124c0.2173 -0.35218 0.5081 -0.65332 0.8523 -0.88288l1.0857 -0.72408" strokeWidth={1}></path>
    <path fill="#c9f7ca" d="M20.8098 2.91309h-6.5684c-0.0671 -0.00034 -0.1334 0.01342 -0.1947 0.0404 -0.0615 0.02696 -0.1165 0.06653 -0.1616 0.11614 -0.0451 0.04961 -0.0792 0.10814 -0.1002 0.17181 -0.0211 0.06366 -0.0285 0.13103 -0.0218 0.19774l0.6371 6.36946 6.7473 -6.74729c-0.0437 -0.04583 -0.0961 -0.08254 -0.154 -0.10798 -0.058 -0.02545 -0.1204 -0.03914 -0.1837 -0.04028Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m14.667 12.4783 -0.9039 -9.03912c-0.0067 -0.06671 0.0007 -0.13408 0.0218 -0.19774 0.021 -0.06367 0.0551 -0.1222 0.1002 -0.17181 0.0451 -0.04961 0.1001 -0.08918 0.1616 -0.11614 0.0613 -0.02698 0.1276 -0.04074 0.1947 -0.0404h6.5684c0.0688 0.00007 0.1367 0.01495 0.1992 0.04365 0.0624 0.02869 0.118 0.07052 0.1629 0.12263 0.0448 0.05211 0.0779 0.11327 0.0969 0.17933 0.0191 0.06605 0.0237 0.13544 0.0135 0.20343l-1.3544 9.01617" strokeWidth={1}></path>
    <path fill="#ffffff" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M17.3001 9.13043c0.2365 0 0.4677 -0.07012 0.6643 -0.2015s0.3498 -0.31812 0.4404 -0.53659c0.0905 -0.21848 0.1141 -0.45889 0.068 -0.69081 -0.0461 -0.23194 -0.16 -0.44499 -0.3272 -0.61219 -0.1672 -0.16722 -0.3803 -0.2811 -0.6122 -0.32723 -0.2319 -0.04613 -0.4723 -0.02246 -0.6908 0.06804 -0.2185 0.09049 -0.4052 0.24375 -0.5366 0.44037 -0.1314 0.19662 -0.2015 0.42778 -0.2015 0.66426 0 0.31711 0.126 0.62122 0.3502 0.84545 0.2242 0.22423 0.5284 0.3502 0.8454 0.3502Z" strokeWidth={1}></path>
  </svg>
);

const PaymentLinkTutorial = ({ showMpTutorial, setShowMpTutorial }: { showMpTutorial: boolean, setShowMpTutorial: (val: boolean) => void }) => (
  <div style={{ marginTop: '16px', marginBottom: '24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <button
      onClick={() => setShowMpTutorial(!showMpTutorial)}
      className="btn btn-secondary btn-lg btn-block"
      style={{
        borderColor: showMpTutorial ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
        color: showMpTutorial ? 'var(--accent)' : '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.3s ease'
      }}
    >
      ¿Cómo tener link de pago?
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showMpTutorial ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    {showMpTutorial && (
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        textAlign: 'left',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <IconWalletColor />
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>Crea una cuenta en <strong>Mercado Pago</strong> (es gratis y personal).</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <IconLinkColor />
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>En tu app de Mercado Pago, ve a <strong>Cobrar con Link</strong> y crea un link genérico o usa tu código QR.</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <IconProfileColor />
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>Pega ese link en tu perfil de <strong>Fim</strong> en la sección "Cobro Directo".</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <IconCheckColor />
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.4' }}>¡Listo! El 100% de los pagos irán directo a tu cuenta sin comisiones.</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

export default function DriverPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'finances'>('map');

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} min aprox.`;
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return mins > 0 ? `${hrs} h ${mins} min aprox.` : `${hrs} h aprox.`;
  };

  const [config, setConfig] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get('/config/public');
        setConfig(res.data.config || {});
      } catch (err) {
        console.error('Error fetching config', err);
      }
    };
    fetchConfig();
  }, []);

  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [hasActivatedOnline, setHasActivatedOnline] = useState(false);

  useEffect(() => {
    if (driver?.id) {
      const val = localStorage.getItem(`fim_driver_has_activated_online_${driver.id}`);
      if (val === 'true') {
        setHasActivatedOnline(true);
      }
    }
  }, [driver]);

  useEffect(() => {
    if (isOnline && driver?.id) {
      localStorage.setItem(`fim_driver_has_activated_online_${driver.id}`, 'true');
      setHasActivatedOnline(true);
    }
  }, [isOnline, driver]);
  const [pos, setPos] = useState(SANTIAGO);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [tripPhase, setTripPhase] = useState<'going_to_passenger' | 'arrived' | 'in_progress'>('going_to_passenger');
  const [arrivedAt, setArrivedAt] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelOption, setSelectedCancelOption] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [timer, setTimer] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [completionOtp, setCompletionOtp] = useState('');
  const [completionOtpVerified, setCompletionOtpVerified] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [payingMembership, setPayingMembership] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftDaysAmount, setGiftDaysAmount] = useState(0);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMsg, setPasswordChangeMsg] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<'success' | 'error' | ''>('');

  // SOS Safety Report States
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyCountdown, setSafetyCountdown] = useState(8);
  const [safetyReason, setSafetyReason] = useState('Incidente de seguridad / Amenaza');
  const [safetyDescription, setSafetyDescription] = useState('');
  const [safetySending, setSafetySending] = useState(false);
  const [safetySent, setSafetySent] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const geoRef = useRef<(() => void) | null>(null);

  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const activeTripRef = useRef(activeTrip);
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  const tripRequestRef = useRef(tripRequest);
  useEffect(() => {
    tripRequestRef.current = tripRequest;
  }, [tripRequest]);

  const [passengerConfirmed, setPassengerConfirmed] = useState(false);
  const [showMpTutorial, setShowMpTutorial] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [paymentRequested, setPaymentRequested] = useState(false);
  const [cancellationNotice, setCancellationNotice] = useState<{ reason: string; wasAccepted?: boolean } | null>(null);

  const [isMinimized, setIsMinimized] = useState(false);
  const [showNavModal, setShowNavModal] = useState(false);

  // Reset minimize state when trip status or phase changes
  useEffect(() => {
    setIsMinimized(false);
  }, [activeTrip?.id, tripPhase]);

  // Helper styles to support collapsing/minimizing bottom sheets smoothly
  const bottomSheetStyle = (customStyle: React.CSSProperties = {}): React.CSSProperties => ({
    transform: isMinimized ? 'translateY(calc(100% - 62px))' : 'translateY(0)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    maxHeight: '85vh',
    overflowY: 'auto',
    ...customStyle
  });

  // Local handle component to minimize/maximize sheets
  const BottomSheetHandle = () => (
    <div
      onClick={() => setIsMinimized(!isMinimized)}
      style={{
        width: '100%',
        padding: '6px 0',
        margin: '0 auto 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'var(--transition)'
      }}
      onMouseEnter={(e) => {
        const bar = e.currentTarget.querySelector('.handle-bar') as HTMLDivElement;
        if (bar) bar.style.background = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        const bar = e.currentTarget.querySelector('.handle-bar') as HTMLDivElement;
        if (bar) bar.style.background = 'var(--border)';
      }}
    >
      <div
        className="handle-bar"
        style={{
          width: '40px',
          height: '4px',
          background: 'var(--border)',
          borderRadius: 'var(--radius-full)',
          transition: 'var(--transition)'
        }}
      />
      <div style={{
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.65rem',
        fontWeight: 800,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {isMinimized ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            Maximizar
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            Minimizar
          </>
        )}
      </div>
    </div>
  );

  // Chat en vivo state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const showChatRef = useRef(false);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  // Clear unread count when chat is opened
  useEffect(() => {
    showChatRef.current = showChat;
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Auto-close chat modal during trip in progress or idle
  useEffect(() => {
    if (tripPhase === 'in_progress' || paymentRequested) {
      setShowChat(false);
    }
  }, [tripPhase, paymentRequested]);

  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);


  const handlePayMembership = async (plan?: string | React.MouseEvent) => {
    if (!driver) return;
    const selectedPlan = (plan && typeof plan === 'string') ? plan : driver.membershipPlan;

    setPayingMembership(true);
    try {
      const res = await api.post('/payments/membership/create-preference', {
        driverId: driver.id,
        plan: selectedPlan,
        email: driver.email,
      });
      if (res.data.init_point) {
        window.location.href = res.data.init_point;
      } else {
        showCustomAlert('No se pudo generar el link de pago.', 'Error', 'error');
      }
    } catch (err: any) {
      showCustomAlert(err.response?.data?.error || 'Error al procesar el pago.', 'Error', 'error');
    } finally {
      setPayingMembership(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/uploads/single', formData);
      const url = res.data.url;

      await api.post('/drivers/pay-comfort-daily', { receiptUrl: url });
      showCustomAlert('Comprobante de pago diario subido correctamente. Deuda actualizada.', 'Éxito', 'success');

      const meRes = await api.get('/drivers/me');
      setDriver(meRes.data.driver);
    } catch (err: any) {
      console.error(err);
      showCustomAlert(err.response?.data?.error || 'Error al subir el comprobante de pago.', 'Error', 'error');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const resetTrip = useCallback(() => {
    setActiveTrip(null);
    setTripPhase('going_to_passenger');
    setPassengerConfirmed(false);
    setReceiptUrl(null);
    setPaymentRequested(false);
    setCompletionOtp('');
    setCompletionOtpVerified(false);
    setChatMessages([]);
    setShowChat(false);
    setUnreadCount(0);
    setShowNavModal(false);
  }, []);

  const handleNavigate = (app: 'waze' | 'google') => {
    if (!activeTrip) return;
    const isPickup = tripPhase === 'going_to_passenger' || tripPhase === 'arrived';
    const lat = isPickup ? activeTrip.originLat : activeTrip.destLat;
    const lng = isPickup ? activeTrip.originLng : activeTrip.destLng;

    let url = '';
    if (app === 'waze') {
      url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }

    window.open(url, '_blank');
    setShowNavModal(false);
  };

  const checkActiveTrip = useCallback(async () => {
    try {
      const res = await api.get('/trips/active');
      if (res.data.trip) {
        const trip = res.data.trip;
        setActiveTrip(trip);
        if (trip.status === 'driver_assigned') {
          setTripPhase('going_to_passenger');
        } else if (trip.status === 'driver_arrived') {
          setTripPhase('arrived');
        } else if (trip.status === 'in_progress') {
          setTripPhase('in_progress');
        }
        if (trip.paymentStatus === 'requested') {
          setPaymentRequested(true);
          setCompletionOtpVerified(false);
        } else if (trip.paymentStatus === 'otp_verified') {
          setPaymentRequested(true);
          setCompletionOtpVerified(true);
        } else if (trip.paymentStatus === 'passenger_confirmed') {
          setPaymentRequested(true);
          setCompletionOtpVerified(true);
          setPassengerConfirmed(true);
        }
        if (trip.receiptUrl) {
          setReceiptUrl(trip.receiptUrl);
        }
        const socket = connectSocket();
        socket.emit('passenger:join-trip', { tripId: trip.id });
      } else {
        if (activeTripRef.current) {
          resetTrip();
        }
      }
    } catch (err) {
      console.error('Error fetching active trip in checkActiveTrip:', err);
    }
  }, [resetTrip]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Visibility] App en primer plano (Conductor). Sincronizando estado y socket...');
        forceReconnectSocket();
        checkActiveTrip();
      }
    };

    const handleFocus = () => {
      console.log('[Focus] Ventana enfocada (Conductor). Sincronizando estado y socket...');
      forceReconnectSocket();
      checkActiveTrip();
    };

    const handleResume = () => {
      console.log('[Resume] App reanudada desde segundo plano (Conductor). Sincronizando estado y socket...');
      forceReconnectSocket();
      checkActiveTrip();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('resume', handleResume);

    // Solicitar permisos de notificación al cargar inicialmente la página en cliente
    import('@/lib/notifications').then(({ requestNotificationPermission }) => {
      requestNotificationPermission().catch(() => { });
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('resume', handleResume);
    };
  }, [checkActiveTrip]);

  // Poll active trip state periodically as a fallback when a trip is active
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('[Poll] Conductor: Sincronizando estado del viaje activo...');
      checkActiveTrip();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [checkActiveTrip]);

  // Cargar datos del conductor
  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/login'); return; }
    setSession(s);

    // Inicializar Notificaciones Push para móviles
    initializePushNotifications();

    setFetchError(null);
    setLoadingTimeout(false);
    const timeoutId = setTimeout(() => {
      setLoadingTimeout(true);
    }, 7000);

    api.get('/drivers/me').then(r => {
      clearTimeout(timeoutId);
      setDriver(r.data.driver);
      setIsOnline(r.data.driver.isOnline);
      if (r.data.driver.lastLat && r.data.driver.lastLng) {
        setPos({ lat: r.data.driver.lastLat, lng: r.data.driver.lastLng });
      }
    }).catch(err => {
      clearTimeout(timeoutId);
      console.error('Error al obtener datos del conductor:', err);
      const status = err.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        clearSession();
        router.push('/login');
      } else {
        setFetchError('No pudimos conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.');
      }
    });

    api.get('/trips/driver-trips').then(r => {
      const completedTrips = r.data.trips.filter((t: any) => t.status === 'completed');
      const sum = completedTrips.reduce((acc: number, t: any) => acc + t.estimatedPrice, 0);
      setTotalEarnings(sum);
    }).catch(() => { });

    checkActiveTrip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => clearTimeout(timeoutId);
  }, []);

  // Poll driver status in the background every 10 seconds to detect gifted days instantly
  useEffect(() => {
    const s = getSession();
    if (!s) return;

    const intervalId = setInterval(() => {
      api.get('/drivers/me').then(r => {
        setDriver(prev => {
          if (!prev) return r.data.driver;
          if (
            prev.giftDaysPending !== r.data.driver.giftDaysPending ||
            prev.membershipExpiresAt !== r.data.driver.membershipExpiresAt ||
            prev.membershipPaid !== r.data.driver.membershipPaid ||
            prev.status !== r.data.driver.status ||
            prev.isOnline !== r.data.driver.isOnline
          ) {
            return r.data.driver;
          }
          return prev;
        });
      }).catch(err => {
        console.error('Error in background driver status poll:', err);
      });
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (driver && driver.giftDaysPending && driver.giftDaysPending > 0 && !showGiftModal) {
      const pendingDays = driver.giftDaysPending;
      setGiftDaysAmount(pendingDays);
      setShowGiftModal(true);
      
      // Play sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
        audio.volume = 0.8;
        audio.play().catch(e => console.error("Audio autoplay was prevented:", e));
      } catch (err) {
        console.error("Failed to play sound effect:", err);
      }

      // Add to local notifications list
      const newNotif = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        text: `Regalo FIM: Se te han regalado ${pendingDays} días de Free Pass, premiando tu compromiso con FIM. ¡Maneje con cuidado jefe!`,
        date: new Date().toISOString(),
        read: false
      };
      setNotifications(prev => {
        const updated = [newNotif, ...prev];
        localStorage.setItem(`fim_driver_notifications_${driver.id}`, JSON.stringify(updated));
        return updated;
      });
      
      // Update local state immediately to avoid double calls
      setDriver(prev => prev ? { ...prev, giftDaysPending: 0 } : null);
      
      // Call endpoint to clear it in DB
      api.post('/drivers/me/clear-gift-pending')
        .catch(err => {
          console.error('Error clearing gift pending status:', err);
        });
    }
  }, [driver, showGiftModal]);

  useEffect(() => {
    if (driver?.id) {
      const saved = localStorage.getItem(`fim_driver_notifications_${driver.id}`);
      if (saved) {
        try {
          setNotifications(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing notifications:", e);
        }
      }
    }
  }, [driver?.id]);

  // GPS tracking
  useEffect(() => {
    if (!isOnline) return;

    let isCancelled = false;
    let cleanupFn: (() => void) | null = null;

    async function startTracking() {
      try {
        const { watchPosition } = await import('@/lib/geolocation');
        if (isCancelled) return;

        cleanupFn = await watchPosition(
          (newPos) => {
            setPos(newPos);
            const socket = connectSocket();
            socket.emit('driver:location', { driverId: session?.user?.id, ...newPos });
            api.post('/drivers/location', { lat: newPos.lat, lng: newPos.lng }).catch(() => { });
            setGpsError(null);
          },
          (err) => {
            console.warn('Driver watchPosition error:', err);
            setGpsError('Señal de GPS perdida o permisos desactivados. Activa la alta precisión para que tus pasajeros te vean.');
          }
        );
        geoRef.current = cleanupFn;
      } catch (err) {
        console.error('Error starting location tracking:', err);
      }
    }

    startTracking();

    return () => {
      isCancelled = true;
      if (cleanupFn) {
        cleanupFn();
      } else if (geoRef.current) {
        geoRef.current();
      }
      geoRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, session]);

  // Socket.io para recibir viajes
  useEffect(() => {
    if (!driver || driver.status !== 'active') return;
    // Para planes BLACK/FLEX requiere membershipPaid; COMFORT requiere haber pagado hoy
    if (!driver.membershipPaid && (driver.membershipPlan === 'BLACK' || driver.membershipPlan === 'FLEX')) return;
    if (!isOnline) return;

    const socket = connectSocket();
    const driverId = session?.user?.id;

    socket.emit('driver:online', { driverId, lat: posRef.current.lat, lng: posRef.current.lng });

    if (activeTrip?.id) {
      socket.emit('passenger:join-trip', { tripId: activeTrip.id });
    }

    socket.on('connect', () => {
      console.log('[Socket] Conductor conectado/reconectado. Consultando estado del viaje...');
      socket.emit('driver:online', { driverId, lat: posRef.current.lat, lng: posRef.current.lng });
      if (activeTripRef.current?.id) {
        socket.emit('passenger:join-trip', { tripId: activeTripRef.current.id });
      }
      checkActiveTrip();
    });

    socket.on('trip:request', ({ trip }: { trip: TripRequest }) => {
      setTripRequest(trip);
      setTimer(30);
      sendLocalNotification("¡Nueva Solicitud de Viaje!", `Tienes un viaje disponible por ${formatCLP(trip.estimatedPrice)}.`);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            socket.emit('driver:reject', { tripId: trip.id, driverId, originLat: trip.originLat, originLng: trip.originLng });
            setTripRequest(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    socket.on('trip:confirmed', ({ trip }: { trip: TripRequest }) => {
      setActiveTrip(trip);
      setTripPhase('going_to_passenger');
      setTripRequest(null);
      sendLocalNotification("¡Viaje Confirmado!", `Vas en camino a recoger a ${trip.passenger.name}.`);
    });

    socket.on('trip:started', (data?: { trip?: any }) => {
      if (!data?.trip?.id || (activeTripRef.current && data.trip.id === activeTripRef.current.id)) {
        setTripPhase('in_progress');
      }
    });

    socket.on('trip:passenger-confirmed-payment', (data: { tripId?: string; receiptUrl?: string }) => {
      console.log('[Socket] Pasajero confirmó pago', data);
      if (!data.tripId || (activeTripRef.current && data.tripId === activeTripRef.current.id)) {
        setPassengerConfirmed(true);
        if (data.receiptUrl) setReceiptUrl(data.receiptUrl);
        const amountVal = activeTripRef.current ? activeTripRef.current.estimatedPrice : 0;
        const amountStr = amountVal ? formatCLP(amountVal) : '';
        sendLocalNotification("Pago Recibido", `El pasajero ha confirmado el pago del viaje${amountStr ? ' por ' + amountStr : ''}.`);
      }
    });

    socket.on('trip:message', (msg: any) => {
      console.log('[Socket] Nuevo mensaje de chat recibido en conductor:', msg);
      if (activeTripRef.current && msg.tripId === activeTripRef.current.id) {
        setChatMessages(prev => [...prev, msg]);
        if (!showChatRef.current) {
          setUnreadCount(prev => prev + 1);
          sendLocalNotification(`Mensaje de ${msg.senderName}`, msg.text);
        }
      }
    });

    socket.on('trip:cancelled', (data: { tripId?: string; reason: string }) => {
      console.log('[Socket] Viaje cancelado por pasajero', data);
      const activeTripId = activeTripRef.current?.id;
      const requestTripId = tripRequestRef.current?.id;

      sendLocalNotification("Viaje Cancelado", `El pasajero canceló la solicitud: "${data.reason}".`);

      if (data.tripId && data.tripId === activeTripId) {
        setCancellationNotice({
          reason: data.reason,
          wasAccepted: true
        });
        resetTrip();
      } else if (data.tripId && data.tripId === requestTripId) {
        setCancellationNotice({
          reason: data.reason,
          wasAccepted: false
        });
        setTripRequest(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (!data.tripId) {
        setCancellationNotice({
          reason: data.reason,
          wasAccepted: !!activeTripRef.current
        });
        setTripRequest(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        resetTrip();
      } else {
        console.log(`[Socket] Cancelación de viaje ${data.tripId} ignorada por no corresponder al viaje activo (${activeTripId}) o solicitud (${requestTripId})`);
      }
    });

    socket.on('trip:completion-otp-verified', (data?: { trip?: any }) => {
      console.log('[Socket] Código de término verificado con éxito');
      setCompletionOtpVerified(true);
    });

    socket.on('trip:completion-otp-failed', (data: { message: string }) => {
      showCustomAlert(data.message, 'Código Incorrecto', 'error');
    });

    socket.on('error', (data: { message: string }) => {
      showCustomAlert(data.message, 'Error', 'error');
    });

    return () => {
      socket.off('connect');
      socket.off('trip:request');
      socket.off('trip:confirmed');
      socket.off('trip:started');
      socket.off('trip:passenger-confirmed-payment');
      socket.off('trip:message');
      socket.off('trip:cancelled');
      socket.off('trip:completion-otp-verified');
      socket.off('trip:completion-otp-failed');
      socket.off('error');
    };
  }, [driver?.id, driver?.status, driver?.membershipPaid, driver?.membershipPlan, isOnline, session?.user?.id, activeTrip?.id, checkActiveTrip]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSafetyModal && safetyCountdown > 0 && !safetySent) {
      timer = setTimeout(() => {
        setSafetyCountdown(prev => prev - 1);
      }, 1000);
    } else if (showSafetyModal && safetyCountdown === 0 && !safetySent && !safetySending) {
      triggerSafetyReport();
    }
    return () => clearTimeout(timer);
  }, [showSafetyModal, safetyCountdown, safetySent, safetySending]);

  const triggerSafetyReport = async () => {
    if (!activeTrip || !session?.user?.id) return;
    setSafetySending(true);
    try {
      const socket = connectSocket();
      
      let lat = pos?.lat || null;
      let lng = pos?.lng || null;
      try {
        const { getCurrentPosition } = await import('@/lib/geolocation');
        const posGps = await getCurrentPosition();
        lat = posGps.lat;
        lng = posGps.lng;
      } catch (e) {
        console.warn('No se pudo obtener GPS preciso para SOS del conductor:', e);
      }

      socket.emit('safety:report', {
        tripId: activeTrip.id,
        reporterId: session.user.id,
        reporterRole: 'driver',
        reportedUserId: activeTrip.passenger.id,
        reason: safetyReason,
        description: safetyDescription || 'Reporte de pánico activado por el conductor.',
        lat,
        lng,
      });
      setSafetySent(true);
    } catch (err) {
      console.error('Error al enviar SOS:', err);
    } finally {
      setSafetySending(false);
    }
  };

  const executeAcceptTrip = useCallback(() => {
    if (!tripRequest) return;
    const socket = connectSocket();
    socket.emit('driver:accept', { tripId: tripRequest.id, driverId: session?.user?.id });
    if (timerRef.current) clearInterval(timerRef.current);
  }, [tripRequest, session]);

  const acceptTrip = () => {
    if (!tripRequest) return;
    // Verificación biométrica desactivada temporalmente (bypass de cámara)
    executeAcceptTrip();
  };

  const rejectTrip = () => {
    if (!tripRequest) return;
    const socket = connectSocket();
    socket.emit('driver:reject', { tripId: tripRequest.id, driverId: session?.user?.id, originLat: tripRequest.originLat, originLng: tripRequest.originLng });
    setTripRequest(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const markArrived = () => {
    if (!activeTrip) return;
    const socket = connectSocket();
    socket.emit('driver:arrived', { tripId: activeTrip.id });
    setTripPhase('arrived');
    setArrivedAt(Date.now());
  };

  const handleCancelTrip = async (reason: string) => {
    if (!activeTrip) return;
    try {
      await api.post(`/trips/${activeTrip.id}/cancel`, { reason });
      setTripPhase('going_to_passenger');
      setActiveTrip(null);
      setArrivedAt(null);
      setShowCancelModal(false);
      setSelectedCancelOption('');
      setCustomCancelReason('');
      showCustomAlert('Viaje cancelado', 'Información', 'info');
    } catch (err: any) {
      showCustomAlert(err.response?.data?.error || 'Error al cancelar', 'Error', 'error');
    }
  };

  const startTrip = (code: string) => {
    if (!activeTrip) return;
    if (!code || code.length < 4) {
      showCustomAlert('Por favor ingresa el código de seguridad.', 'Atención', 'warning');
      return;
    }
    const socket = connectSocket();
    socket.emit('driver:start-trip', { tripId: activeTrip.id, otpCode: code });
  };

  const handleRequestPayment = () => {
    if (!activeTrip) return;
    showCustomConfirm(
      '¿Estás seguro de solicitar el pago al pasajero? Hazlo solo cuando hayas llegado al destino de forma segura.',
      'Solicitar Pago',
      () => {
        const socket = connectSocket();
        socket.emit('trip:request-payment', { tripId: activeTrip.id });
        setPaymentRequested(true);
        setCompletionOtpVerified(false);
      }
    );
  };

  const verifyCompletionOtp = (code: string) => {
    if (!activeTrip) return;
    if (!code || code.length < 4) {
      showCustomAlert('Por favor ingresa el código de término.', 'Atención', 'warning');
      return;
    }
    const socket = connectSocket();
    socket.emit('driver:verify-completion-otp', { tripId: activeTrip.id, otpCode: code });
  };

  const completeTrip = async () => {
    if (!activeTrip) return;
    const socket = connectSocket();
    socket.emit('trip:complete', { tripId: activeTrip.id });

    // Sum estimated price to totalEarnings locally for instant visual update
    const tripPrice = activeTrip.estimatedPrice;
    setTotalEarnings(prev => (prev !== null ? prev + tripPrice : tripPrice));

    resetTrip();

    // Refetch driver details and full trip list in background to sync with DB
    setTimeout(async () => {
      try {
        const dRes = await api.get('/drivers/me');
        setDriver(dRes.data.driver);

        const tRes = await api.get('/trips/driver-trips');
        const completedTrips = tRes.data.trips.filter((t: any) => t.status === 'completed');
        const sum = completedTrips.reduce((acc: number, t: any) => acc + t.estimatedPrice, 0);
        setTotalEarnings(sum);
      } catch (err) {
        console.error('Error refreshing driver stats:', err);
      }
    }, 800);
  };



  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setLoading(true);

    if (newStatus && driver) {
      if (!driver.mercadoPagoLink) {
        showCustomAlert('Debes vincular tu link de Mercado Pago para poder ponerte en línea y recibir pagos de tus viajes.', 'Atención', 'warning');
        setLoading(false);
        return;
      }
      const now = new Date();
      if (driver.membershipPlan === 'BLACK' && !driver.membershipPaid && !driver.isPromoActive) {
        setShowPaymentModal(true);
        setLoading(false);
        return;
      }
      if (driver.membershipPlan === 'FLEX') {
        const day = now.getDay();
        const isWeekend = day === 0 || day === 5 || day === 6;
        if (!isWeekend) {
          showCustomAlert('La membresía FLEX solo te permite operar los días Viernes, Sábado y Domingo.', 'Membresía FLEX', 'warning');
          setLoading(false);
          return;
        }
        if (!driver.membershipPaid && !driver.isPromoActive) {
          setShowPaymentModal(true);
          setLoading(false);
          return;
        }
      }
      if (driver.membershipPlan === 'COMFORT') {
        let paidToday = false;
        if (driver.comfortLastPaidAt) {
          const lastPaid = new Date(driver.comfortLastPaidAt);
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          paidToday = lastPaid >= todayStart;
        }
        if (!paidToday && !driver.isPromoActive) {
          setShowPaymentModal(true);
          setLoading(false);
          return;
        }
      }
    }

    if (newStatus) {
      const lat = posRef.current.lat;
      const lng = posRef.current.lng;
      if (lat === 0 && lng === 0) {
        showCustomAlert('No se ha podido detectar tu ubicación GPS. Habilita tu ubicación para continuar.', 'Error de GPS', 'error');
        setLoading(false);
        return;
      }
      const isInChile = lat >= -56.0 && lat <= -17.5 && lng >= -76.0 && lng <= -66.0;
      if (!isInChile) {
        showCustomAlert('Estás fuera del área de servicio (Chile). No es posible ponerse en línea.', 'Fuera de Cobertura', 'warning');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.post('/drivers/toggle-online', { isOnline: newStatus });
      setIsOnline(res.data.isOnline);
      const socket = connectSocket();
      if (res.data.isOnline) {
        socket.emit('driver:online', { driverId: session?.user?.id, lat: posRef.current.lat, lng: posRef.current.lng });
      } else {
        socket.emit('driver:offline', { driverId: session?.user?.id });
      }
    } catch (err: any) {
      if (err.response?.data?.error === 'Biometric Required') {
        setShowBiometricModal(true);
        return;
      }
      showCustomAlert(err.response?.data?.error || 'Error al cambiar estado', 'Error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showHistory, setShowHistory] = useState(false);
  const [mpLink, setMpLink] = useState('');

  const [customDialog, setCustomDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    isConfirm: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    show: false,
    title: 'Atención',
    message: '',
    type: 'info',
    isConfirm: false
  });

  const showCustomAlert = (message: string, title = 'Atención', type: 'success' | 'error' | 'warning' | 'info' = 'info', onClose?: () => void) => {
    setCustomDialog({
      show: true,
      title,
      message,
      type,
      isConfirm: false,
      onConfirm: onClose
    });
  };

  const showCustomConfirm = (message: string, title: string, onConfirm: () => void, onCancel?: () => void, type: 'success' | 'error' | 'warning' | 'info' = 'warning') => {
    setCustomDialog({
      show: true,
      title,
      message,
      type,
      isConfirm: true,
      onConfirm,
      onCancel
    });
  };

  useEffect(() => {
    if (driver?.mercadoPagoLink) setMpLink(driver.mercadoPagoLink);
  }, [driver]);

  const getFreePassExpirationDateObj = () => {
    if (!driver) return new Date();
    if (driver.membershipExpiresAt) {
      return new Date(driver.membershipExpiresAt);
    }
    const createdAt = new Date(driver.createdAt);
    const freeDays = driver.freePassDays || 0;
    return new Date(createdAt.getTime() + freeDays * 24 * 60 * 60 * 1000);
  };

  const getFreePassExpirationDate = () => {
    return getFreePassExpirationDateObj().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getRemainingDaysForModal = () => {
    if (driver?.isTrial) {
      return getRemainingFreePassDays();
    }
    return giftDaysAmount;
  };

  const markAllNotificationsAsRead = () => {
    if (!driver?.id) return;
    setNotifications(prev => {
      const updated = prev.map((n: any) => ({ ...n, read: true }));
      localStorage.setItem(`fim_driver_notifications_${driver.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const getRemainingFreePassDays = () => {
    if (!driver) return 0;
    if (driver.isTrial && driver.membershipExpiresAt) {
      const expDate = new Date(driver.membershipExpiresAt);
      const diffMs = expDate.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
      return diffDays > 0 ? diffDays : 0;
    }
    const createdAt = new Date(driver.createdAt);
    const freeDays = driver.freePassDays || 0;
    const expDate = new Date(createdAt.getTime() + freeDays * 24 * 60 * 60 * 1000);
    const diffMs = expDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return diffDays > 0 ? diffDays : 0;
  };

  const getEstimatedPaidExpirationDate = () => {
    if (!driver) return '';
    const baseDate = getFreePassExpirationDateObj();
    const estDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    return estDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleFreePassClick = () => {
    showCustomAlert(
      `Bienvenido a FIM, la app que une a pasajeros y conductores más rentable del país. Nuestra app es 0% comisión.\n\n¡Aprovecha al máximo este FREE PASS!\n\n📅 Tu Free Pass vence el: ${getFreePassExpirationDate()}\n⏳ Si decides pagar tu membresía, esta se extenderá hasta el: ${getEstimatedPaidExpirationDate()} (30 días adicionales para ser totalmente transparentes).\n\n¡Saludos Jefe, conduzca con precaución! 🚗`,
      '¡Felicitaciones! FREE PASS Activo',
      'success'
    );
  };

  const saveMPLink = async () => {
    try {
      await api.post('/drivers/payment-link', { mercadoPagoLink: mpLink });
      showCustomAlert('Link de pago vinculado correctamente.', 'Éxito', 'success');
      if (driver) {
        setDriver({ ...driver, mercadoPagoLink: mpLink });
      }
    } catch (err) {
      showCustomAlert('Error al guardar el link.', 'Error', 'error');
    }
  };

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const handleDeleteAccount = () => {
    showCustomConfirm(
      '¿Estás seguro?\n\nSe eliminarán todos los datos de tu cuenta en FIM de forma irreversible, todo quedará fuera de la base de datos.',
      'Borrar mi cuenta',
      () => {
        showCustomConfirm(
          'ÚLTIMA ADVERTENCIA: Si continúas, perderás todo el acceso a tu cuenta de Fim inmediatamente y de forma definitiva. ¿Confirmas la eliminación permanente de tu cuenta?',
          'Última Advertencia',
          async () => {
            try {
              await api.post('/auth/delete-account');
              showCustomAlert(
                'Tu cuenta ha sido eliminada con éxito. Esperamos verte de nuevo.',
                'Cuenta Eliminada',
                'success',
                () => {
                  clearSession();
                  router.push('/login');
                }
              );
            } catch (err: any) {
              showCustomAlert(err.response?.data?.error || 'Error al eliminar la cuenta', 'Error', 'error');
            }
          },
          () => {
            showCustomAlert('Eliminación cancelada. Tu cuenta sigue activa.', 'Cancelado', 'info');
          },
          'error'
        );
      },
      undefined,
      'error'
    );
  };

  const openProfileModal = async () => {
    setShowProfileModal(true);
    setPasswordChangeMsg('');
    setPasswordChangeStatus('');
    try {
      const res = await api.get('/auth/me');
      const latestUser = res.data.user;
      const updatedSession = { ...session, user: latestUser };
      setSession(updatedSession);
      localStorage.setItem('fim_user', JSON.stringify(latestUser));
    } catch (err) {
      console.error('Error refreshing profile in modal open:', err);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMsg('Las contraseñas nuevas no coinciden');
      setPasswordChangeStatus('error');
      return;
    }
    setPasswordChangeLoading(true);
    setPasswordChangeMsg('');
    setPasswordChangeStatus('');
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordChangeMsg('Contraseña actualizada con éxito');
      setPasswordChangeStatus('success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordChangeMsg(err.response?.data?.error || 'Error al cambiar contraseña');
      setPasswordChangeStatus('error');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  if (fetchError && !driver) return (
    <div className="status-screen">
      <div style={{ color: 'var(--danger)', marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      </div>
      <h2>Error de conexión</h2>
      <p style={{ maxWidth: '300px', margin: '0 auto 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{fetchError}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Salir</button>
      </div>
    </div>
  );

  if (loadingTimeout && !driver) return (
    <div className="status-screen">
      <div style={{ color: 'var(--warning)', marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
      </div>
      <h2>La carga está tardando mucho</h2>
      <p style={{ maxWidth: '300px', margin: '0 auto 20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Parece que la conexión con el servidor se ha demorado más de lo esperado o hay un problema al iniciar la app.</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
        <button className="btn btn-secondary" onClick={handleLogout}>Cerrar sesión / Salir</button>
      </div>
    </div>
  );

  if (!driver) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#09090f',
      gap: '16px'
    }}>
      <div className="spinner"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando perfil de conductor...</p>
    </div>
  );

  if (driver.status === 'pending') return (
    <div style={{ padding: '24px 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto', background: '#09090f', gap: '20px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px 16px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: 'auto 0' }}>
        <div style={{ color: 'var(--warning)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, textAlign: 'center' }}>Tu cuenta está en revisión</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center', lineHeight: '1.5' }}>
          Una vez que se validen los documentos personales y los del vehículo, se activarán tus días <strong>FREE PASS</strong>. Que espere atento a su correo electrónico.
        </p>

        <p style={{ fontSize: '0.85rem', color: 'var(--accent)', margin: 0, textAlign: 'center', lineHeight: '1.5', fontWeight: 700 }}>
          Mientras hacemos esto podrías configurar tu link de pago.
        </p>

        {/* Mercado Pago Link Config */}
        <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
          {!driver.mercadoPagoLink ? (
            <div style={{ background: 'rgba(0,229,160,0.05)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', marginBottom: '10px' }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>¡Vincular Mercado Pago Connect!</p>
              <input
                type="text" className="form-input" placeholder="Pega tu link aquí..."
                value={mpLink} onChange={(e) => setMpLink(e.target.value)}
                style={{ marginBottom: '12px' }}
              />
              <button
                className="btn btn-accent btn-block"
                onClick={saveMPLink}
                disabled={!mpLink.toLowerCase().includes('mercadopago') && !mpLink.toLowerCase().includes('mpago')}
              >
                Vincular Cuenta
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,229,160,0.1)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', marginBottom: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>
                ✓ Link de Mercado Pago configurado.
              </p>
            </div>
          )}
          {!driver.mercadoPagoLink && (
            <PaymentLinkTutorial showMpTutorial={showMpTutorial} setShowMpTutorial={setShowMpTutorial} />
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>
        <button className="btn btn-secondary btn-block" onClick={handleLogout}>Salir</button>
        <button
          onClick={handleDeleteAccount}
          className="btn"
          style={{
            width: '100%',
            padding: '12px',
            fontWeight: 700,
            borderRadius: '10px',
            background: 'rgba(255, 69, 96, 0.1)',
            color: 'var(--danger)',
            border: '1px solid rgba(255, 69, 96, 0.2)',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 69, 96, 0.15)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 69, 96, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 69, 96, 0.2)'; }}
        >
          ✕ Borrar mi cuenta
        </button>
      </div>
    </div>
  );

  return (
    <div className={`app-container${isMenuOpen ? ' menu-open' : ''}`}>
      <header className="app-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div
            className="logo-hover-container"
            onMouseEnter={() => setIsLogoHovered(true)}
            onMouseLeave={() => setIsLogoHovered(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div className="logo" style={{ margin: 0 }}>Fim<span>.</span></div>

            <div style={{
              opacity: isLogoHovered ? 1 : 0,
              transform: isLogoHovered ? 'translateY(0)' : 'translateY(-6px)',
              pointerEvents: isLogoHovered ? 'auto' : 'none',
              transition: 'all 0.3s ease',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border-accent)',
              boxShadow: 'var(--shadow-accent)',
              padding: '6px 14px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--accent)',
              whiteSpace: 'nowrap',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'flex-start',
              zIndex: 1000,
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '8px'
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Ve tus ganancias</span>
              <span style={{ lineHeight: 1.1 }}>Ganancias: {totalEarnings !== null ? formatCLP(totalEarnings) : '$0'}</span>
            </div>
          </div>

          {/* Nombre y Membresía del Conductor (debajo del logo) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            {driver?.name && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1 }}>
                {driver.name}
              </span>
            )}
            {activeTab !== 'finances' && driver?.membershipPlan && (
              <div
                className={`seal-${driver.membershipPlan.toLowerCase()}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.58rem',
                  fontWeight: 950,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}
              >
                {driver.membershipPlan === 'BLACK' ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                      <path d="M3 20h18" />
                    </svg>
                    <span>Conductor BLACK</span>
                  </>
                ) : driver.membershipPlan === 'COMFORT' ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Conductor COMFORT</span>
                  </>
                ) : (
                  <>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block' }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                    <span>Conductor FLEX</span>
                  </>
                )}
              </div>
            )}
            {activeTab !== 'finances' && driver?.isPromoActive && (
              <div
                onClick={handleFreePassClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(212, 175, 55, 0.15)',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: '#D4AF37',
                  whiteSpace: 'nowrap',
                  marginTop: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.25)';
                  e.currentTarget.style.transform = 'scale(1.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Gift-Box-1--Streamline-Ultimate" height="20" width="20" style={{ flexShrink: 0 }}>
                  <path fill="#78eb7b" d="M17.2609 11.0435H6.73967c-0.25367 0 -0.49695 0.1008 -0.67632 0.2802 -0.17938 0.1793 -0.28015 0.4226 -0.28015 0.6763v0.9565c0 0.2536 0.10077 0.4969 0.28015 0.6763 0.17937 0.1794 0.42265 0.2801 0.67632 0.2801h0.47824l0.41511 5.8068c0.0172 0.2417 0.12552 0.4679 0.30306 0.6328 0.17755 0.1649 0.41108 0.2563 0.65341 0.2557h6.82731c0.2423 0.0006 0.4759 -0.0908 0.6534 -0.2557s0.2859 -0.3911 0.3031 -0.6328l0.4093 -5.8068h0.4783c0.2536 0 0.4969 -0.1007 0.6763 -0.2801s0.2801 -0.4227 0.2801 -0.6763V12c0 -0.2537 -0.1007 -0.497 -0.2801 -0.6763 -0.1794 -0.1794 -0.4227 -0.2802 -0.6763 -0.2802Z" strokeWidth={1}></path>
                  <path fill="#ff808c" d="M13.4348 11.0435h-2.8694v9.5647h2.8694v-9.5647Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M10.5656 13.9129H6.73967c-0.25367 0 -0.49695 -0.1007 -0.67632 -0.2801 -0.17938 -0.1794 -0.28015 -0.4227 -0.28015 -0.6763V12c0 -0.2537 0.10077 -0.497 0.28015 -0.6763 0.17937 -0.1794 0.42265 -0.2802 0.67632 -0.2802H17.2609c0.2536 0 0.4969 0.1008 0.6763 0.2802 0.1794 0.1793 0.2801 0.4226 0.2801 0.6763v0.9565c0 0.2536 -0.1007 0.4969 -0.2801 0.6763s-0.4227 0.2801 -0.6763 0.2801H13.435" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M13.4348 13.913h3.3477l-0.4151 5.8067c-0.0172 0.2417 -0.1255 0.4679 -0.3031 0.6328 -0.1775 0.165 -0.4111 0.2564 -0.6534 0.2558H8.58648c-0.24233 0.0006 -0.47586 -0.0908 -0.6534 -0.2558 -0.17755 -0.1649 -0.28586 -0.3911 -0.30307 -0.6328l-0.41224 -5.8067h3.34763" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M10.5654 11.0435v9.5647" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M13.4346 20.6082v-9.5647" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.65217 9.78864c0.57389 0.57766 3.34763 1.25486 3.34763 1.25486s-0.6781 -2.77374 -1.2549 -3.34762c-0.2775 -0.27752 -0.6539 -0.43343 -1.04635 -0.43343 -0.39246 0 -0.76886 0.15591 -1.04638 0.43343 -0.27751 0.27751 -0.43342 0.65391 -0.43342 1.04638 0 0.39246 0.15591 0.76886 0.43342 1.04638Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3477 9.78869C14.7738 10.3664 12 11.0436 12 11.0436s0.6781 -2.77379 1.2549 -3.34767c0.2805 -0.26251 0.6521 -0.40571 1.0362 -0.39934 0.3841 0.00637 0.7508 0.1618 1.0224 0.43346 0.2717 0.27166 0.4271 0.63828 0.4335 1.02242 0.0064 0.38413 -0.1368 0.7557 -0.3993 1.03622Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12 4.82649V3.39178" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m18.7627 7.628 1.0148 -1.01386" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M21.5654 13.913h1.4347" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M5.2365 7.628 4.22168 6.61414" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.43471 13.913H1" strokeWidth={1}></path>
                </svg>
                <span style={{ fontSize: '0.68rem', letterSpacing: '0.01em' }}>
                  FREE PASS quedan {getRemainingFreePassDays()} días
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Campanita de Notificaciones Amarilla */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotificationsModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#FF3B30',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '0.65rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #0D0D15',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}>
                  {notifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Hamburger button */}
            <button
              onClick={() => setIsMenuOpen(prev => !prev)}
              style={{
                background: isMenuOpen ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                border: `1.5px solid ${isMenuOpen ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                color: isMenuOpen ? 'var(--accent)' : 'var(--text-primary)',
                outline: 'none',
                padding: '0',
                flexShrink: 0,
              }}
            >
              {/* Hamburger → X animation */}
              <span style={{
                display: 'block',
                width: '16px',
                height: '2px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'transform 0.25s ease, opacity 0.25s ease',
                transform: isMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '16px',
                height: '2px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'opacity 0.25s ease',
                opacity: isMenuOpen ? 0 : 1,
              }} />
              <span style={{
                display: 'block',
                width: '16px',
                height: '2px',
                background: 'currentColor',
                borderRadius: '2px',
                transition: 'transform 0.25s ease, opacity 0.25s ease',
                transform: isMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              }} />
            </button>

            {/* Dropdown menu */}
            {isMenuOpen && (
              <div className="header-menu-dropdown">
                {activeTab === 'finances' ? (
                  <button className="header-nav-btn" onClick={() => { setActiveTab('map'); setIsMenuOpen(false); }}>
                    <div className="icon-circle">
                      <IconCompass />
                    </div>
                    <span className="btn-label">Volver al Mapa</span>
                  </button>
                ) : (
                  <button className="header-nav-btn" onClick={() => { setActiveTab('finances'); setIsMenuOpen(false); }}>
                    <div className="icon-circle">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                    </div>
                    <span className="btn-label">Finanzas</span>
                  </button>
                )}

                <button className="header-nav-btn" onClick={() => { openProfileModal(); setIsMenuOpen(false); }}>
                  <div className="icon-circle">
                    <IconUser />
                  </div>
                  <span className="btn-label">Usuario</span>
                </button>

                <button className="header-nav-btn" onClick={() => { router.push('/driver/history'); setIsMenuOpen(false); }}>
                  <div className="icon-circle">
                    <IconClock />
                  </div>
                  <span className="btn-label">Historial</span>
                </button>

                <button className="header-nav-btn" onClick={() => { setIsMenuOpen(false); handleLogout(); }}>
                  <div className="icon-circle">
                    <IconLogout />
                  </div>
                  <span className="btn-label">Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backdrop para cerrar menú hamburguesa al tocar afuera */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
          }}
        />
      )}

      {/* Botón flotante de SOS en viaje activo */}
      {activeTrip && (
        <button 
          onClick={() => {
            setShowSafetyModal(true);
            setSafetyCountdown(8);
          }}
          title="SOS Emergencia"
          className="sos-button"
          style={{
            position: 'fixed',
            right: '24px',
            top: '150px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--danger)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(255, 69, 96, 0.4)',
            cursor: 'pointer',
            zIndex: 1005,
            fontWeight: 'bold',
            fontSize: '0.82rem',
          }}
        >
          🚨 SOS
        </button>
      )}

      {/* Botón flotante de GPS de alta prioridad fuera de main-content */}
      {activeTab !== 'finances' && (
        <button
        onClick={() => {
          setCenterTrigger(prev => prev + 1);
        }}
        title="Mi ubicación actual"
        className="gps-button"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>
      </button>
      )}

      <main className="main-content">

        {/* HUD de GPS para el Conductor */}
        {gpsError && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <div style={{ flex: 1 }}>{gpsError}</div>
            <button
              onClick={() => setGpsError(null)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ×
            </button>
          </div>
        )}

        <DriverMap
          driverPos={pos}
          passengerPos={(activeTrip && (tripPhase === 'going_to_passenger' || tripPhase === 'arrived')) ? { lat: activeTrip.originLat, lng: activeTrip.originLng } : null}
          destPos={(activeTrip && tripPhase === 'in_progress') ? { lat: activeTrip.destLat, lng: activeTrip.destLng } : null}
          stops={activeTrip?.stops || []}
          centerTrigger={centerTrigger}
        />

        {activeTab === 'finances' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--bg-primary)', overflowY: 'auto', paddingTop: '80px' }}>
            <div style={{ padding: '0 20px', marginBottom: '-10px' }}>
              <button 
                onClick={() => setActiveTab('map')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Volver al mapa
              </button>
            </div>
            <FinancesDashboard />
          </div>
        )}
      </main>

      {/* DASHBOARD INFERIOR */}
      {!tripRequest && !activeTrip && activeTab === 'map' && (
        <div className="bottom-sheet" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Hola, {driver.name}</h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#FFC107'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                  {driver.totalRating > 0 ? driver.totalRating.toFixed(1) : 'Nuevo'}
                </div>
                {driver.membershipPlan && (
                  <div className={`seal-${driver.membershipPlan.toLowerCase()}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '0.62rem',
                    fontWeight: 950,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {driver.membershipPlan === 'BLACK' ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
                          <path d="M3 20h18" />
                        </svg>
                        <span>BLACK</span>
                      </>
                    ) : driver.membershipPlan === 'COMFORT' ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>COMFORT</span>
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        <span>FLEX</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                {driver.vehicleBrand} {driver.vehicleModel} · {driver.vehiclePlate} · {driver.totalTrips} {driver.totalTrips === 1 ? 'viaje' : 'viajes'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              {/* Recaudación removida: Ahora se muestra en Fim Finanzas */}
            </div>
          </div>

          {driver.isPromoActive && !isOnline && !hasActivatedOnline && (
            <div style={{
              background: 'rgba(255,239,94,0.08)',
              border: '1px solid rgba(255,239,94,0.3)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              textAlign: 'left'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Party-Popper-1--Streamline-Ultimate" height="24" width="24" style={{ flexShrink: 0 }}>
                <desc>
                  Party Popper 1 Streamline Icon: https://streamlinehq.com
                </desc>
                <path fill="#ffbfc5" d="M8.1735 7.69558c1.32067 0 2.3913 -1.07061 2.3913 -2.39128 0 -1.32066 -1.07063 -2.39128 -2.3913 -2.39128 -1.32066 0 -2.39127 1.07062 -2.39127 2.39128 0 1.32067 1.07061 2.39128 2.39127 2.39128Z" strokeWidth={1}></path>
                <path fill="#c2f3ff" d="M19.6518 6.26081c1.0566 0 1.913 -0.85649 1.913 -1.91302s-0.8564 -1.91302 -1.913 -1.91302 -1.913 0.85649 -1.913 1.91302 0.8564 1.91302 1.913 1.91302Z" strokeWidth={1}></path>
                <path fill="#c9f7ca" d="M19.1733 15.8259c1.0565 0 1.913 -0.8564 1.913 -1.913s-0.8565 -1.913 -1.913 -1.913c-1.0566 0 -1.913 0.8564 -1.913 1.913s0.8564 1.913 1.913 1.913Z" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M16.2876 12.2065c0.8907 -0.8888 2.0976 -1.388 3.3559 -1.388 1.2583 0 2.4652 0.4992 3.3559 1.388" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.7778 7.71279c0.441 -0.44067 0.7908 -0.96391 1.0294 -1.53982 0.2387 -0.57589 0.3615 -1.19318 0.3615 -1.81657 0 -0.6234 -0.1228 -1.24068 -0.3615 -1.81658 -0.2386 -0.57591 -0.5884 -1.09915 -1.0294 -1.53982" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m17.8105 8.41199 3.3564 -1.11721" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m15.5732 6.17664 1.1192 -3.35735" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.14014 5.08525c0.06341 0 0.12424 0.0252 0.16909 0.07004 0.04484 0.04484 0.07003 0.10566 0.07003 0.16909" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M7.90088 5.32438c0 -0.06343 0.02519 -0.12425 0.07003 -0.16909 0.04486 -0.04484 0.10568 -0.07004 0.1691 -0.07004" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.14001 5.56351c-0.06342 0 -0.12424 -0.02519 -0.1691 -0.07004 -0.04484 -0.04484 -0.07 -0.10567 -0.07 -0.16908" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.37926 5.32439c0 0.06341 -0.02519 0.12424 -0.07003 0.16908 -0.04485 0.04485 -0.10568 0.07004 -0.16909 0.07004" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.314 7.95479c0.0634 0 0.1242 0.02519 0.1691 0.07003 0.0448 0.04485 0.07 0.10567 0.07 0.1691" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.0747 8.19392c0 -0.06343 0.0252 -0.12425 0.07 -0.1691 0.0449 -0.04484 0.1057 -0.07003 0.1691 -0.07003" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3138 8.43304c-0.0634 0 -0.1242 -0.0252 -0.1691 -0.07005 -0.0448 -0.04484 -0.07 -0.10566 -0.07 -0.16908" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.5531 8.19391c0 0.06342 -0.0252 0.12424 -0.07 0.16908 -0.0449 0.04485 -0.1057 0.07005 -0.1691 0.07005" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.1396 13.6938c0.0635 0 0.1243 0.0252 0.1692 0.0701 0.0448 0.0448 0.07 0.1057 0.07 0.1691" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M18.9009 13.933c0 -0.0634 0.0251 -0.1243 0.07 -0.1691 0.0449 -0.0449 0.1057 -0.0701 0.1691 -0.0701" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.14 14.1721c-0.0634 0 -0.1242 -0.0251 -0.1691 -0.07 -0.0449 -0.0449 -0.07 -0.10567 -0.07 -0.1691" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.3788 13.933c0 0.0634 -0.0252 0.1242 -0.07 0.1691 -0.0449 0.0449 -0.1057 0.07 -0.1692 0.07" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.6182 4.12874c0.0634 0 0.1242 0.02519 0.1691 0.07003 0.0448 0.04485 0.07 0.10567 0.07 0.1691" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.3789 4.36787c0 -0.06343 0.0252 -0.12425 0.07 -0.1691 0.0449 -0.04484 0.1057 -0.07003 0.1691 -0.07003" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.618 4.607c-0.0634 0 -0.1242 -0.02519 -0.1691 -0.07004 -0.0448 -0.04484 -0.07 -0.10567 -0.07 -0.16909" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M19.8573 4.36787c0 0.06342 -0.0252 0.12425 -0.07 0.16909 -0.0449 0.04485 -0.1057 0.07004 -0.1691 0.07004" strokeWidth={1}></path>
                <path fill="#ffef5e" d="M15.0082 16.3759 2.89783 22.8477c-0.24402 0.1304 -0.52354 0.1789 -0.79724 0.1384 -0.27371 -0.0407 -0.5271 -0.1683 -0.7227 -0.364 -0.19561 -0.1957 -0.32306 -0.4492 -0.36354 -0.7229 -0.040465 -0.2738 0.0082 -0.5533 0.1388 -0.7972l6.4708 -12.11035 7.38425 7.38425Z" strokeWidth={1}></path>
                <path fill="#fff9bf" d="M11.316 12.6838 7.62386 8.99165 1.15306 21.102c-0.13042 0.2443 -0.178524 0.5242 -0.13717 0.798 0.04136 0.2739 0.16998 0.5271 0.36674 0.7219l9.93337 -9.9381Z" strokeWidth={1}></path>
                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.0082 16.3759 2.89783 22.8477c-0.24402 0.1304 -0.52354 0.1789 -0.79724 0.1384 -0.27371 -0.0407 -0.5271 -0.1683 -0.7227 -0.364 -0.19561 -0.1957 -0.32306 -0.4492 -0.36354 -0.7229 -0.040465 -0.2738 0.0082 -0.5533 0.1388 -0.7972l6.4708 -12.11035" strokeWidth={1}></path>
                <path fill="#ffbc44" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.2422 16.1965c0.9339 -0.934 0.0254 -3.3564 -2.0291 -5.4109S8.73618 7.82266 7.80233 8.75651c-0.93387 0.93386 -0.02542 3.35639 2.02906 5.41079 2.05451 2.0545 4.47691 2.963 5.41081 2.0292Z" strokeWidth={1}></path>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)' }}>¡Felicitaciones!</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#fff', lineHeight: '1.4' }}>
                  Bienvenido a FIM, la app que une a pasajeros y conductores más rentable del país. Nuestra app es <strong>0% comisión</strong>, ¡A disfrutar jefe!
                </p>
              </div>
            </div>
          )}

          {driver.isPromoActive && !isOnline && !hasActivatedOnline && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid #D4AF37',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '20px',
              textAlign: 'left',
              boxShadow: '0 8px 32px rgba(212,175,55,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Gift-Box-1--Streamline-Ultimate" height="24" width="24" style={{ flexShrink: 0 }}>
                  <desc>
                    Gift Box 1 Streamline Icon: https://streamlinehq.com
                  </desc>
                  <path fill="#78eb7b" d="M17.2609 11.0435H6.73967c-0.25367 0 -0.49695 0.1008 -0.67632 0.2802 -0.17938 0.1793 -0.28015 0.4226 -0.28015 0.6763v0.9565c0 0.2536 0.10077 0.4969 0.28015 0.6763 0.17937 0.1794 0.42265 0.2801 0.67632 0.2801h0.47824l0.41511 5.8068c0.0172 0.2417 0.12552 0.4679 0.30306 0.6328 0.17755 0.1649 0.41108 0.2563 0.65341 0.2557h6.82731c0.2423 0.0006 0.4759 -0.0908 0.6534 -0.2557s0.2859 -0.3911 0.3031 -0.6328l0.4093 -5.8068h0.4783c0.2536 0 0.4969 -0.1007 0.6763 -0.2801s0.2801 -0.4227 0.2801 -0.6763V12c0 -0.2537 -0.1007 -0.497 -0.2801 -0.6763 -0.1794 -0.1794 -0.4227 -0.2802 -0.6763 -0.2802Z" strokeWidth={1}></path>
                  <path fill="#ff808c" d="M13.4348 11.0435h-2.8694v9.5647h2.8694v-9.5647Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M10.5656 13.9129H6.73967c-0.25367 0 -0.49695 -0.1007 -0.67632 -0.2801 -0.17938 -0.1794 -0.28015 -0.4227 -0.28015 -0.6763V12c0 -0.2537 0.10077 -0.497 0.28015 -0.6763 0.17937 -0.1794 0.42265 -0.2802 0.67632 -0.2802H17.2609c0.2536 0 0.4969 0.1008 0.6763 0.2802 0.1794 0.1793 0.2801 0.4226 0.2801 0.6763v0.9565c0 0.2536 -0.1007 0.4969 -0.2801 0.6763s-0.4227 0.2801 -0.6763 0.2801H13.435" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M13.4348 13.913h3.3477l-0.4151 5.8067c-0.0172 0.2417 -0.1255 0.4679 -0.3031 0.6328 -0.1775 0.165 -0.4111 0.2564 -0.6534 0.2558H8.58648c-0.24233 0.0006 -0.47586 -0.0908 -0.6534 -0.2558 -0.17755 -0.1649 -0.28586 -0.3911 -0.30307 -0.6328l-0.41224 -5.8067h3.34763" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M10.5654 11.0435v9.5647" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M13.4346 20.6082v-9.5647" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M8.65217 9.78864c0.57389 0.57766 3.34763 1.25486 3.34763 1.25486s-0.6781 -2.77374 -1.2549 -3.34762c-0.2775 -0.27752 -0.6539 -0.43343 -1.04635 -0.43343 -0.39246 0 -0.76886 0.15591 -1.04638 0.43343 -0.27751 0.27751 -0.43342 0.65391 -0.43342 1.04638 0 0.39246 0.15591 0.76886 0.43342 1.04638Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3477 9.78869C14.7738 10.3664 12 11.0436 12 11.0436s0.6781 -2.77379 1.2549 -3.34767c0.2805 -0.26251 0.6521 -0.40571 1.0362 -0.39934 0.3841 0.00637 0.7508 0.1618 1.0224 0.43346 0.2717 0.27166 0.4271 0.63828 0.4335 1.02242 0.0064 0.38413 -0.1368 0.7557 -0.3993 1.03622Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12 4.82649V3.39178" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m18.7627 7.628 1.0148 -1.01386" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M21.5654 13.913h1.4347" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M5.2365 7.628 4.22168 6.61414" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.43471 13.913H1" strokeWidth={1}></path>
                </svg>
                <span style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.05rem' }}>
                  FREE PASS Activo
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#fff', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                Tienes pase libre para recibir viajes en el plan {driver.membershipPlan}.
              </p>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                Pase libre vence el: <strong style={{ color: '#fff' }}>{getFreePassExpirationDate()}</strong>
                <div style={{ marginTop: '4px' }}>
                  Término de membresía estimado (+30 días): <strong style={{ color: '#fff' }}>{getEstimatedPaidExpirationDate()}</strong>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.72rem', color: '#D4AF37', lineHeight: '1.45' }}>
                  * Una vez finalizado tu periodo de FREE PASS, podrás pagar y renovar tu membresía directamente en este panel.
                </div>
              </div>
            </div>
          )}


          {!isOnline && !driver.mercadoPagoLink && (
            <>
              <div style={{ background: 'rgba(0,229,160,0.05)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--accent)', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', marginBottom: '12px', fontWeight: 600 }}>¡Vincular Mercado Pago Connect!</p>
                <input
                  type="text" className="form-input" placeholder="Pega tu link aquí..."
                  value={mpLink} onChange={(e) => setMpLink(e.target.value)}
                  style={{ marginBottom: '12px' }}
                />
                <button
                  className="btn btn-accent btn-block"
                  onClick={saveMPLink}
                  disabled={!mpLink.toLowerCase().includes('mercadopago') && !mpLink.toLowerCase().includes('mpago')}
                  style={{ marginBottom: '10px' }}
                >
                  Vincular Cuenta
                </button>
              </div>
              <PaymentLinkTutorial showMpTutorial={showMpTutorial} setShowMpTutorial={setShowMpTutorial} />
            </>
          )}

          {/* ─── PANEL DE MEMBRESÍA POR PLAN ─────────────────────────────── */}
          {!driver.isPromoActive && driver.membershipPlan === 'BLACK' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.03))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '20px', height: '20px', flexShrink: 0, color: '#D4AF37' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <div>
                    <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.85rem' }}>Plan BLACK</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {driver.membershipPaid
                        ? driver.membershipExpiresAt
                          ? `Vence: ${new Date(driver.membershipExpiresAt).toLocaleDateString('es-CL')}`
                          : 'Activo ∞'
                        : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '12px', height: '12px', flexShrink: 0 }}>
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Membresía no pagada
                          </span>
                        )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1rem' }}>$150.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/mes</div>
                </div>
              </div>
              {!driver.membershipPaid && (
                <button
                  className="btn btn-accent btn-block"
                  onClick={handlePayMembership}
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'normal', height: 'auto', minHeight: '44px', padding: '10px 14px', lineHeight: '1.3', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Membresía BLACK con Mercado Pago'}
                </button>
              )}
            </div>
          )}

          {!driver.isPromoActive && driver.membershipPlan === 'COMFORT' && (() => {
            const lastPaid = driver.comfortLastPaidAt ? new Date(driver.comfortLastPaidAt) : null;
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const paidToday = lastPaid && lastPaid >= todayStart;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: `1px solid ${!paidToday ? 'rgba(239,68,68,0.4)' : 'rgba(59,130,246,0.25)'}`, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {paidToday ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Check--Streamline-Ultimate" height="24" width="24" style={{ flexShrink: 0 }}>
                          <desc>Check Streamline Icon: https://streamlinehq.com</desc>
                          <path fill="#78eb7b" d="M1.98657 13.7043c-0.4235 0.4235 -0.4235 1.1101 0 1.5336l5.20337 5.2042c0.42414 0.4225 1.11017 0.4225 1.53441 0L22.013 7.1525c0.4235 -0.42341 0.4235 -1.10999 0 -1.53349l-2.0591 -2.05994c-0.4235 -0.42414 -1.1108 -0.42414 -1.5344 0L7.9571 14.0224l-2.37701 -2.3781c-0.42378 -0.4235 -1.11073 -0.4235 -1.53441 0l-2.05911 2.06Z" strokeWidth={1}></path>
                          <path fill="#c9f7ca" d="M7.95731 17.1666 20.7591 4.3649l-0.8086 -0.8085c-0.4238 -0.42359 -1.1106 -0.42359 -1.5344 0L7.95731 14.0224 5.5803 11.6443c-0.42359 -0.424 -1.1109 -0.424 -1.5344 0l-0.8086 0.8086 4.72001 4.7137Z" strokeWidth={1}></path>
                          <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1.98657 13.7043c-0.4235 0.4235 -0.4235 1.1101 0 1.5336l5.20337 5.2042c0.42414 0.4225 1.11017 0.4225 1.53441 0L22.013 7.1525c0.4235 -0.42341 0.4235 -1.10999 0 -1.53349l-2.0591 -2.05994c-0.4235 -0.42414 -1.1108 -0.42414 -1.5344 0L7.9571 14.0224l-2.37701 -2.3781c-0.42378 -0.4235 -1.11073 -0.4235 -1.53441 0l-2.05911 2.06Z" strokeWidth={1}></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Alert-Triangle--Streamline-Ultimate" height="24" width="24" style={{ flexShrink: 0 }}>
                          <desc>Alert Triangle Streamline Icon: https://streamlinehq.com</desc>
                          <path fill="#ffb834" d="M12 2L1 21h22L12 2z" strokeWidth={1}></path>
                          <path fill="#ffe5aa" d="M12 6l7.5 13H4.5L12 6z" strokeWidth={1}></path>
                          <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12 2L1 21h22L12 2z" strokeWidth={1}></path>
                          <path stroke="#191919" strokeLinecap="round" d="M12 9v5" strokeWidth={2}></path>
                          <circle cx="12" cy="17" r="1.5" fill="#191919"></circle>
                        </svg>
                      )}
                      <div>
                        <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.85rem' }}>Plan COMFORT</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {paidToday ? 'Pagado hoy — puedes trabajar' : 'Debes pagar la cuota de hoy'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#FBBF24', fontWeight: 900, fontSize: '1rem' }}>$20.000</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/día</div>
                    </div>
                  </div>
                  {(driver.comfortDebt || 0) > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#FCA5A5' }}>
                      ⚠️ Deuda acumulada: <strong>${(driver.comfortDebt || 0).toLocaleString('es-CL')}</strong> — Sube el comprobante o paga en línea para activarte.
                    </div>
                  )}
                </div>

                {!paidToday && (
                  <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px dashed var(--border)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className="btn btn-accent btn-block"
                      onClick={handlePayMembership}
                      disabled={payingMembership}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'normal', height: 'auto', minHeight: '44px', padding: '10px 14px', lineHeight: '1.3', fontSize: '0.85rem', textAlign: 'center' }}
                    >
                      {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Cuota Diaria con Mercado Pago'}
                    </button>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                        O transfiere a la cuenta de Fim SpA y sube el comprobante:
                        <br /><strong>Banco:</strong> Banco Estado | <strong>Cta Corriente:</strong> 987654321
                        <br /><strong>RUT:</strong> 76.543.210-K | <strong>Email:</strong> pagos@fim.cl
                      </div>

                      <label style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '8px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {uploadingReceipt ? (
                            'Subiendo comprobante...'
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Office-Drawer--Streamline-Ultimate" height="16" width="16" style={{ flexShrink: 0 }}>
                                <desc>Office Drawer Streamline Icon: https://streamlinehq.com</desc>
                                <path fill="#e3e3e3" d="M2.9126 8.65216V3.86955c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06642 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86957" strokeWidth={1}></path>
                                <path fill="#ffffff" d="M2.9126 12.4781V7.69554c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06641 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86952" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.9126 12.4781V7.69554c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06641 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86952" strokeWidth={1}></path>
                                <path fill="#e3bfb3" d="M1 13.4347c0 -0.2537 0.10078 -0.497 0.28016 -0.6764 0.17938 -0.1793 0.42267 -0.2802 0.67636 -0.2802H22.0435c0.2536 0 0.497 0.1009 0.6763 0.2802 0.1794 0.1794 0.2802 0.4227 0.2802 0.6764v6.6956c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1793 -0.4227 0.2801 -0.6763 0.2801H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2801C1.10078 20.6273 1 20.384 1 20.1303v-6.6956Z" strokeWidth={1}></path>
                                <path fill="#c77f67" d="M22.0435 18.2174H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2802C1.10078 17.7579 1 17.5145 1 17.2609v2.8695c0 0.2537 0.10078 0.497 0.28016 0.6764 0.17938 0.1793 0.42267 0.2801 0.67636 0.2801H22.0435c0.2536 0 0.497 -0.1008 0.6763 -0.2801 0.1794 -0.1794 0.2802 -0.4227 0.2802 -0.6764v-2.8695c0 0.2536 -0.1008 0.497 -0.2802 0.6763 -0.1793 0.1794 -0.4227 0.2802 -0.6763 0.2802Z" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1 13.4347c0 -0.2537 0.10078 -0.497 0.28016 -0.6764 0.17938 -0.1793 0.42267 -0.2802 0.67636 -0.2802H22.0435c0.2536 0 0.497 0.1009 0.6763 0.2802 0.1794 0.1794 0.2802 0.4227 0.2802 0.6764v6.6956c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1793 -0.4227 0.2801 -0.6763 0.2801H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2801C1.10078 20.6273 1 20.384 1 20.1303v-6.6956Z" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.9126 4.82607v-0.95652c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06642 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M9.13037 15.3477h5.73913" strokeWidth={1}></path>
                              </svg>
                              Subir Comprobante de Transferencia
                            </>
                          )}
                        </span>
                        <input type="file" accept="image/*" onChange={handleReceiptUpload} disabled={uploadingReceipt} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {!driver.isPromoActive && driver.membershipPlan === 'FLEX' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🟢</span>
                  <div>
                    <div style={{ color: '#34D399', fontWeight: 900, fontSize: '0.85rem' }}>Plan FLEX</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {driver.membershipPaid
                        ? driver.membershipExpiresAt
                          ? `Vence: ${new Date(driver.membershipExpiresAt).toLocaleDateString('es-CL')}`
                          : 'Activo'
                        : '⚠️ Membresía no pagada'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1rem' }}>$60.000</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem' }}>/fin de semana</div>
                </div>
              </div>
              {!driver.membershipPaid && (
                <button
                  className="btn btn-accent btn-block"
                  onClick={handlePayMembership}
                  disabled={payingMembership}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'normal', height: 'auto', minHeight: '44px', padding: '10px 14px', lineHeight: '1.3', fontSize: '0.85rem', textAlign: 'center' }}
                >
                  {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Membresía FLEX con Mercado Pago'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => {
                  const today = new Date().getDay();
                  const dayMap = [1, 2, 3, 4, 5, 6, 0];
                  const isToday = dayMap[i] === today;
                  const isActive = i >= 4;
                  return (
                    <div key={d} style={{
                      flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 800,
                      background: isToday ? (isActive ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.2)') : (isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)'),
                      color: isToday ? (isActive ? '#34D399' : '#FCA5A5') : (isActive ? '#34D399' : 'rgba(255,255,255,0.2)'),
                      border: `1px solid ${isToday ? (isActive ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.3)') : 'transparent'}`,
                    }}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            className={`btn btn-block btn-lg ${isOnline ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleToggleOnline}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-sm" style={{ borderLeftColor: 'transparent', margin: '0 auto', display: 'inline-block' }}></span>
            ) : isOnline ? (
              'Desconectarse'
            ) : (
              'Ponerse en línea'
            )}
          </button>
        </div>
      )}

      {/* SOLICITUD ENTRANTE */}
      {tripRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            background: '#12121e',
            border: '2px solid rgba(49, 130, 206, 0.5)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(49, 130, 206, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            color: '#FFFFFF',
            position: 'relative'
          }}>

            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  background: '#E2E8F0',
                  color: '#1A202C',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Fim Priority
                </div>
                <div style={{
                  background: 'rgba(49, 130, 206, 0.25)',
                  color: '#63B3ED',
                  padding: '6px 12px',
                  borderRadius: '100px',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}>
                  Exclusivo
                </div>
              </div>
              <button
                onClick={rejectTrip}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#A0AEC0',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
              >
                ✕
              </button>
            </div>

            {/* Price display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tarifa Base (100% para ti)
              </div>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: '1' }}>
                {formatCLP(tripRequest.estimatedPrice)}
              </div>
              {tripRequest.paymentMethod === 'card' ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, marginTop: '4px' }}>
                  💳 Tarjeta (Pasajero paga {formatCLP(tripRequest.estimatedPrice)})
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#63B3ED', fontWeight: 700, marginTop: '4px' }}>
                  💵 Efectivo (Pasajero paga {formatCLP(tripRequest.estimatedPrice)})
                </div>
              )}
            </div>

            {/* Verification Badge */}
            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
              <div style={{
                background: 'rgba(66, 153, 225, 0.12)',
                color: '#63B3ED',
                padding: '6px 12px',
                borderRadius: '100px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(66, 153, 225, 0.2)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Carnet de identidad verificado
              </div>
            </div>

            {/* Sub-header pills row */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                {tripRequest.paymentMethod === 'card' ? 'Pago con tarjeta' : 'Pago en efectivo'}
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#ECC94B' }}>★</span> {(4.7 + (tripRequest.passenger.name.charCodeAt(0) % 4) * 0.1).toFixed(2).replace('.', ',')}
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>👥</span> {tripRequest.passengerCount || 1} {(tripRequest.passengerCount || 1) === 1 ? 'persona' : 'personas'}
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#E2E8F0', padding: '5px 12px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                {tripRequest.passenger.name}
              </div>
            </div>

            {/* Promo/Incentive row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#CBD5E0',
              fontSize: '0.82rem',
              marginBottom: '20px',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              border: '1px dashed rgba(255,255,255,0.08)',
              textAlign: 'left'
            }}>
              <span style={{ color: '#F6AD55', fontSize: '1rem' }}>✪</span>
              <span><strong>+{formatCLP(tripRequest.estimatedPrice * 0.1)}</strong> por inicio de viaje prioritario</span>
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }} />

            {/* Route Timeline */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', position: 'relative' }}>
              {/* Vertical timeline bar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '12px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid #3182CE',
                  borderRadius: '50%',
                  background: '#12121e',
                  zIndex: 2,
                  marginTop: '4px'
                }} />
                <div style={{
                  width: '2px',
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.15)',
                  margin: '4px 0'
                }} />
                <div style={{
                  width: '10px',
                  height: '10px',
                  background: '#ECC94B',
                  borderRadius: '2px',
                  zIndex: 2,
                  marginBottom: '12px'
                }} />
              </div>

              {/* Addresses details */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                {/* Pickup Address */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, marginBottom: '2px' }}>
                    A 2 min ({tripRequest.driverDistance.toFixed(1)} km)
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px' }}>
                    {tripRequest.originAddress}
                  </div>
                </div>

                {/* Paradas (si existen) */}
                {tripRequest.stops && tripRequest.stops.length > 0 && (
                  <div style={{ marginTop: '8px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#A0AEC0', fontWeight: 600, marginBottom: '2px' }}>
                      Paradas Intermedias ({tripRequest.stops.length})
                    </div>
                    {tripRequest.stops.map((stop: any, idx: number) => (
                      <div key={idx} style={{ fontSize: '0.85rem', fontWeight: 500, color: '#F6AD55', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px' }}>🟠</span> {stop.address || `Parada ${idx + 1}`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Destination Address */}
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600, marginBottom: '2px' }}>
                    Viaje: {tripRequest.durationMin} min ({tripRequest.distanceKm.toFixed(1)} km)
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, color: '#ECC94B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠️</span> {tripRequest.destAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={rejectTrip}
                style={{
                  flex: 1,
                  padding: '16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 69, 96, 0.4)',
                  background: 'rgba(255, 69, 96, 0.1)',
                  color: '#FF4560',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Rechazar
              </button>
              <button
                onClick={acceptTrip}
                style={{
                  flex: 2,
                  padding: '16px',
                  borderRadius: '14px',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: `linear-gradient(to right, #3182CE ${(timer / 30) * 100}%, #1E293B ${(timer / 30) * 100}%)`,
                  boxShadow: '0 4px 15px rgba(49, 130, 206, 0.4)'
                }}
              >
                Aceptar ({timer}s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIAJE ACTIVO */}
      {activeTrip && (
        <div className="bottom-sheet animate-slide-up" style={bottomSheetStyle()}>
          <BottomSheetHandle />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="driver-avatar">{activeTrip.passenger.name[0]}</div>
              <div>
                <div style={{ fontWeight: 800 }}>{activeTrip.passenger.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Pasajero</span> · <span>👥 {activeTrip.passengerCount || 1} {(activeTrip.passengerCount || 1) === 1 ? 'persona' : 'personas'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setShowNavModal(true)}
                style={{
                  borderRadius: '12px',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--accent)',
                  background: '#1A1A28',
                  border: '1px solid var(--border-accent)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = '#222235';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#1A1A28';
                }}
              >
                <IconCompass />
                <span>Navegar</span>
              </button>

              {tripPhase !== 'in_progress' && (
                <button
                  onClick={() => setShowChat(true)}
                  style={{
                    borderRadius: '50%',
                    width: '42px',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#00E5A0',
                    background: '#1A1A28',
                    border: '1px solid rgba(0, 229, 160, 0.3)',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = '#222235';
                    e.currentTarget.style.borderColor = '#00E5A0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = '#1A1A28';
                    e.currentTarget.style.borderColor = 'rgba(0, 229, 160, 0.3)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  {unreadCount > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'var(--danger)',
                      color: 'white',
                      borderRadius: '50%',
                      minWidth: '18px',
                      height: '18px',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(255, 69, 96, 0.6)'
                    }}>
                      {unreadCount}
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {tripPhase === 'going_to_passenger' ? 'Recogida' : 'Destino'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
                <IconClock /> {formatDuration(activeTrip.durationMin)}
              </div>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {tripPhase === 'going_to_passenger' ? activeTrip.originAddress : activeTrip.destAddress}
            </div>

            {/* Paradas */}
            {tripPhase === 'in_progress' && activeTrip.stops && activeTrip.stops.length > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Paradas</div>
                {activeTrip.stops.map((stop: any, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFA500', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                     <span style={{ fontSize: '10px' }}>🟠</span> {stop.address || `Parada ${idx + 1}`}
                  </div>
                ))}
              </div>
            )}
          </div>

          {tripPhase === 'going_to_passenger' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCancelModal(true)}>Cancelar</button>
              <button className="btn btn-primary btn-lg" style={{ flex: 2 }} onClick={markArrived}>He llegado</button>
            </div>
          )}

          {tripPhase === 'arrived' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center' }}>Pide el código al pasajero para iniciar:</p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <input
                  type="text" className="form-input" placeholder="CÓDIGO"
                  value={otp} onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 900 }}
                />
                <button className="btn btn-accent" onClick={() => startTrip(otp)}>INICIAR</button>
              </div>
              <button className="btn btn-danger btn-block" onClick={() => setShowCancelModal(true)}>Cancelar Viaje</button>
            </div>
          )}

          {tripPhase === 'in_progress' && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              {!paymentRequested ? (
                <div style={{ textAlign: 'center' }}>
                  <button
                    className="btn btn-primary btn-block btn-lg"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    onClick={handleRequestPayment}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    Solicitar Pago ({activeTrip.paymentMethod === 'card' ? `${formatCLP(activeTrip.estimatedPrice)} MP` : `${formatCLP(activeTrip.estimatedPrice)} Efec.`})
                  </button>
                  <div style={{
                    marginTop: '12px',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '10px',
                    borderRadius: 'var(--radius)',
                    textAlign: 'left',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--accent)' }}>
                      <span>Total Pasajero a Pagar:</span>
                      <span>{formatCLP(activeTrip.estimatedPrice)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ animation: 'fadeIn 0.4s' }}>
                  {!completionOtpVerified ? (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center', fontWeight: 600 }}>
                        Pide el código de término al pasajero para habilitar el pago:
                      </p>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                          type="text" className="form-input" placeholder="CÓDIGO"
                          value={completionOtp} onChange={(e) => setCompletionOtp(e.target.value)}
                          style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', fontWeight: 900 }}
                        />
                        <button className="btn btn-accent" onClick={() => verifyCompletionOtp(completionOtp)}>VERIFICAR</button>
                      </div>
                    </div>
                  ) : !passengerConfirmed ? (
                    <div style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid var(--warning)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--warning)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        ESPERANDO PAGO...
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', borderTop: '1px solid rgba(255,184,0,0.2)', paddingTop: '8px' }}>
                        Monto a cobrar al pasajero:
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--warning)', marginTop: '4px' }}>
                          {formatCLP(activeTrip.estimatedPrice)}
                        </div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-muted)' }}>
                          {activeTrip.paymentMethod === 'card'
                            ? '(Pago con Tarjeta)'
                            : '(Pago en Efectivo)'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(0,229,160,0.1)', border: '2px solid var(--accent)', padding: '16px', borderRadius: 'var(--radius)', marginBottom: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 800, fontSize: '1rem' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        ¡PAGO CONFIRMADO!
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', borderTop: '1px solid rgba(0,229,160,0.2)', paddingTop: '8px' }}>
                        Monto del Pago realizado:
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent)', marginTop: '4px' }}>
                          {formatCLP(activeTrip.estimatedPrice)}
                        </div>
                        <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--text-muted)' }}>
                          {activeTrip.paymentMethod === 'card'
                            ? 'Tarjeta (Mercado Pago)'
                            : 'Efectivo'}
                        </span>
                      </div>
                      {receiptUrl && (
                        <button onClick={() => window.open(receiptUrl, '_blank')} style={{ marginTop: '10px', border: 'none', background: 'none' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={receiptUrl} alt="Comprobante" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '4px' }} />
                        </button>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button className={`btn btn-block btn-lg ${passengerConfirmed ? 'btn-primary' : 'btn-secondary'}`} onClick={() => {
                      if (!passengerConfirmed) {
                        showCustomConfirm(
                          'El pasajero no ha confirmado el pago. ¿Deseas cerrar el viaje de forma manual?',
                          'Cerrar Manualmente',
                          () => {
                            completeTrip();
                          }
                        );
                      } else {
                        completeTrip();
                      }
                    }}>
                      {passengerConfirmed ? 'Verificar y Finalizar' : 'Cerrar Manual (Sin Confirmación)'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL CANCELAR VIAJE (CONDUCTOR) */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>¿Por qué cancelas tu viaje?</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Motivo de cancelación:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  'Cambio de ruta no acordado',
                  'Excede capacidad legal',
                  'Comportamiento agresivo',
                  'Pasajero no se presentó',
                  'Problema mecánico',
                  'Otro motivo'
                ].map((reasonOption) => {
                  let isDisabled = false;
                  if (reasonOption === 'Pasajero no se presentó') {
                    isDisabled = tripPhase !== 'arrived' || !arrivedAt || (Date.now() - arrivedAt < 5 * 60 * 1000);
                  }
                  return (
                    <button
                      key={reasonOption}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedCancelOption(reasonOption)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: selectedCancelOption === reasonOption ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: selectedCancelOption === reasonOption ? 'rgba(0, 229, 160, 0.1)' : 'var(--bg-primary)',
                        color: isDisabled ? 'var(--text-muted)' : (selectedCancelOption === reasonOption ? 'var(--accent)' : 'var(--text-primary)'),
                        textAlign: 'left',
                        fontWeight: selectedCancelOption === reasonOption ? 700 : 500,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isDisabled ? 0.5 : 1
                      }}
                    >
                      {reasonOption}
                      {isDisabled && reasonOption === 'Pasajero no se presentó' && (
                        <span style={{ display: 'block', fontSize: '0.7rem', marginTop: '4px' }}>
                          Disponible tras 5 minutos de espera.
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedCancelOption === 'Otro motivo' && (
                <div style={{ marginTop: '12px' }}>
                  <textarea
                    className="form-input"
                    placeholder="Describe el motivo de la cancelación..."
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    rows={3}
                    style={{ width: '100%', resize: 'none' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedCancelOption('');
                  setCustomCancelReason('');
                }}
              >
                Volver atrás
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                disabled={!selectedCancelOption || (selectedCancelOption === 'Otro motivo' && !customCancelReason.trim())}
                onClick={async () => {
                  const finalReason = selectedCancelOption === 'Otro motivo' ? customCancelReason : selectedCancelOption;
                  await handleCancelTrip(finalReason);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHAT EN VIVO */}
      {showChat && activeTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            overflow: 'hidden'
          }}>
            {/* Header del Chat */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Chat con Pasajero</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Viaje activo · Seguro y directo</p>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Mensajes del Chat */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '40px'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.5 }}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  <p style={{ fontSize: '0.85rem' }}>Escribe un mensaje para coordinar la recogida o detalles del viaje.</p>
                </div>
              ) : (
                chatMessages.map((m, i) => {
                  const isMe = m.senderId === session?.user?.id;
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{
                        background: isMe ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                        color: isMe ? '#09090F' : 'var(--text-primary)',
                        padding: '10px 14px',
                        borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        lineHeight: 1.4,
                        boxShadow: isMe ? 'var(--shadow-accent)' : 'none'
                      }}>
                        {m.text}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {new Date(m.timestamp).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input del Chat */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                const socket = connectSocket();
                socket.emit('trip:message', {
                  tripId: activeTrip.id,
                  senderId: session?.user?.id,
                  senderName: driver ? driver.name : activeTrip.passenger.name,
                  text: chatInput
                });
                setChatInput('');
              }}
              style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                gap: '10px',
                background: 'rgba(255,255,255,0.01)'
              }}
            >
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  background: '#1A1A28',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'white',
                  padding: '10px 16px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#09090F',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontWeight: 900
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}


      {cancellationNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 12000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '400px', border: '1px solid var(--border-accent)', background: '#0D0D15', padding: '24px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>⚠️</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', marginBottom: '8px' }}>Viaje Cancelado</h2>
              <span className="badge badge-danger" style={{ fontSize: '0.85rem', background: 'rgba(255, 69, 96, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: '100px', fontWeight: 700 }}>
                EL PASAJERO CANCELÓ EL VIAJE
              </span>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px', textAlign: 'center' }}>
              El pasajero ha decidido cancelar este viaje por el siguiente motivo:
            </p>

            <div style={{
              background: 'rgba(255, 69, 96, 0.05)',
              border: '1px solid rgba(255, 69, 96, 0.2)',
              padding: '16px',
              borderRadius: 'var(--radius)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <strong style={{ color: 'white', fontSize: '1rem' }}>"{cancellationNotice.reason}"</strong>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px', lineHeight: '1.4' }}>
              Por favor no te acerques al punto de recogida. Tu panel se ha restablecido a modo disponible.
            </p>

            <button className="btn btn-accent btn-block btn-lg" onClick={() => setCancellationNotice(null)}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE NAVEGACIÓN EXTERNA */}
      {showNavModal && activeTrip && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '360px',
            background: 'var(--bg-secondary, #12121e)',
            border: '1px solid var(--border-accent, rgba(0, 229, 160, 0.3))',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg, 0 10px 40px rgba(0, 0, 0, 0.6))',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>Selecciona tu Navegador</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #a0aec0)' }}>
              ¿Con qué aplicación deseas seguir la ruta al {tripPhase === 'going_to_passenger' || tripPhase === 'arrived' ? 'punto de recogida' : 'destino'}?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => handleNavigate('google')}
                className="btn btn-block btn-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Google Maps
              </button>

              <button
                onClick={() => handleNavigate('waze')}
                className="btn btn-block btn-lg"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#33CCFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Waze
              </button>
            </div>

            <button
              onClick={() => setShowNavModal(false)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '8px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE PAGO FLOTANTE AL PRESIONAR "PONERSE EN LÍNEA" */}
      {showPaymentModal && driver && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 11000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-scale-in" style={{
            width: '100%',
            maxWidth: '440px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid var(--border-accent, rgba(0, 229, 160, 0.3))',
            background: '#0D0D15',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Cash-Payment-Coin-Dollar--Streamline-Ultimate" height="24" width="24" style={{ flexShrink: 0 }}>
                  <desc>Cash Payment Coin Dollar Streamline Icon: https://streamlinehq.com</desc>
                  <path fill="#ffef5e" d="M15.348 13.2434c0.7813 0.0146 1.5576 -0.1266 2.2838 -0.4154 0.7261 -0.2888 1.3874 -0.7193 1.9453 -1.2665 0.5578 -0.5472 1.0011 -1.2001 1.3038 -1.92048 0.3028 -0.7204 0.459 -1.4939 0.4595 -2.27534 0.0005 -0.78143 -0.1547 -1.55514 -0.4565 -2.27593 -0.3018 -0.7208 -0.7442 -1.37424 -1.3014 -1.92216 -0.5571 -0.54792 -1.2179 -0.97934 -1.9436 -1.26907 -0.7258 -0.28973 -1.502 -0.43196 -2.2833 -0.41838 -1.5416 0.02678 -3.011 0.65771 -4.0921 1.75701 -1.081 1.09929 -1.6873 2.57908 -1.6883 4.12088 -0.00101 1.5418 0.6033 3.02237 1.683 4.12307 1.0796 1.1007 2.5482 1.7336 4.0898 1.7623Z" strokeWidth={1}></path>
                  <path fill="#fff9bf" d="M15.3475 1.47827c-1.1559 -0.00084 -2.2864 0.33914 -3.2501 0.97742 -0.9637 0.63829 -1.7178 1.54655 -2.16795 2.61117 -0.45018 1.06462 -0.57648 2.23835 -0.36308 3.37438 0.2134 1.13602 0.75703 2.18396 1.56283 3.01256l8.3122 -8.31214c-1.0951 -1.06775 -2.5644 -1.66475 -4.0939 -1.66339Z" strokeWidth={1}></path>
                  <path fill="#ffdda1" d="m20.1304 16.7826 -4.2287 1.4061h-0.0106c0.0866 -0.1598 0.1262 -0.3409 0.1142 -0.5223 -0.0119 -0.1813 -0.075 -0.3556 -0.1818 -0.5027 -0.1069 -0.1471 -0.2531 -0.2609 -0.4219 -0.3283 -0.1688 -0.0675 -0.3533 -0.0857 -0.532 -0.0528H12c-1.1337 -1.1699 -2.67626 -1.8555 -4.30435 -1.913H4.82609L1 16.7826v5.7391l3.82609 -2.3913C15.0877 23.5519 11.3027 23.5863 23 17.7391c-0.3227 -0.4342 -0.771 -0.7589 -1.2842 -0.9299 -0.5133 -0.1711 -1.0667 -0.1804 -1.5854 -0.0266Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.348 13.2434c0.7813 0.0146 1.5576 -0.1266 2.2838 -0.4154 0.7261 -0.2888 1.3874 -0.7193 1.9453 -1.2665 0.5578 -0.5472 1.0011 -1.2001 1.3038 -1.92048 0.3028 -0.7204 0.459 -1.4939 0.4595 -2.27534 0.0005 -0.78143 -0.1547 -1.55514 -0.4565 -2.27593 -0.3018 -0.7208 -0.7442 -1.37424 -1.3014 -1.92216 -0.5571 -0.54792 -1.2179 -0.97934 -1.9436 -1.26907 -0.7258 -0.28973 -1.502 -0.43196 -2.2833 -0.41838 -1.5416 0.02678 -3.011 0.65771 -4.0921 1.75701 -1.081 1.09929 -1.6873 2.57908 -1.6883 4.12088 -0.00101 1.5418 0.6033 3.02237 1.683 4.12307 1.0796 1.1007 2.5482 1.7336 4.0898 1.7623Z" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3477 4.34782V3.3913" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M16.7821 4.34784h-1.9407c-0.2981 0.00021 -0.5867 0.10411 -0.8165 0.29387 -0.2298 0.18977 -0.3864 0.45358 -0.443 0.74619 -0.0565 0.29261 -0.0095 0.59578 0.133 0.85751 0.1426 0.26173 0.3717 0.46571 0.6482 0.57695l1.9743 0.79009c0.2764 0.11124 0.5056 0.31522 0.6481 0.57695 0.1426 0.26173 0.1896 0.5649 0.133 0.85751 -0.0565 0.2926 -0.2131 0.55642 -0.4429 0.74618 -0.2298 0.18977 -0.5185 0.29371 -0.8165 0.29391h-1.9465" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M15.3477 11.0435v-0.9565" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m15.9017 18.1887 4.2287 -1.4061c0.5187 -0.1538 1.0721 -0.1445 1.5854 0.0266 0.5132 0.1711 0.9615 0.4957 1.2842 0.93 -11.6973 5.8472 -7.9123 5.8127 -18.17391 2.3913L1 22.5218" strokeWidth={1}></path>
                  <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M9.6087 18.6957h5.2609c0.1399 0.0251 0.2836 0.0192 0.421 -0.0173 0.1375 -0.0364 0.2652 -0.1026 0.3743 -0.1938 0.109 -0.0912 0.1967 -0.2053 0.2569 -0.3341 0.0602 -0.1288 0.0914 -0.2692 0.0914 -0.4114 0 -0.1421 -0.0312 -0.2826 -0.0914 -0.4114 -0.0602 -0.1288 -0.1479 -0.2428 -0.2569 -0.334 -0.1091 -0.0912 -0.2368 -0.1574 -0.3743 -0.1939 -0.1374 -0.0364 -0.2811 -0.0423 -0.421 -0.0172H12c-1.1337 -1.1699 -2.67626 -1.8555 -4.30435 -1.913H4.82609L1 16.7826" strokeWidth={1}></path>
                </svg>
                Pago de Membresía requerido
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 'bold' }}
              >
                ×
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Debes estar al día con tu membresía para poder ponerte en línea y recibir solicitudes de viajes.
            </p>

            {(() => {
              // BLACK Plan Checks
              const hasBlackDiscount = (driver.membershipPlan === 'BLACK' && ((driver.nextDiscount !== undefined && driver.nextDiscount > 0) || (driver.membershipProgress >= driver.membershipGoal))) || (driver.membershipProgress >= 150);
              const remainingBlackTrips = Math.max(0, 150 - driver.membershipProgress);

              const blackNormalPrice = parseInt(config.membership_black_normal_price || '199990', 10);
              const blackPromoPrice = parseInt(config.membership_black_promo_price || '49990', 10);
              const blackFinalPrice = hasBlackDiscount ? blackPromoPrice * 0.8 : blackPromoPrice;
              
              const comfortNormalPrice = parseInt(config.membership_comfort_normal_price || '15990', 10);
              const comfortPromoPrice = parseInt(config.membership_comfort_promo_price || '8990', 10);

              const flexNormalPrice = parseInt(config.membership_flex_normal_price || '60000', 10);
              const flexPromoPrice = parseInt(config.membership_flex_promo_price || '19990', 10);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                  {/* PLAN BLACK */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(212,175,55,0.02))', border: '1px solid rgba(212,175,55,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '0.9rem' }}>Plan BLACK</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Mensual Ilimitado (30 días)</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#D4AF37', fontWeight: 900, fontSize: '1.1rem' }}>
                          {hasBlackDiscount ? (
                            <>
                              <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: '6px', fontSize: '0.85rem' }}>{formatCLP(blackPromoPrice)}</span>
                              {formatCLP(blackFinalPrice)}
                            </>
                          ) : (
                            <>
                              <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: '6px', fontSize: '0.85rem' }}>{formatCLP(blackNormalPrice)}</span>
                              {formatCLP(blackPromoPrice)}
                            </>
                          )}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/mes</div>
                      </div>
                    </div>
                    {hasBlackDiscount ? (
                      <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600 }}>
                        🎉 ¡Meta de 150 viajes cumplida! Tienes 20% de descuento ({formatCLP(blackFinalPrice)}).
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 600 }}>
                        ⏳ Llevas {driver.membershipProgress} viajes. Te faltan {remainingBlackTrips} viajes para obtener 20% de descuento ({formatCLP(blackPromoPrice * 0.8)}) en tu renovación.
                      </div>
                    )}
                    <button
                      className="btn btn-accent btn-block"
                      onClick={() => handlePayMembership('BLACK')}
                      disabled={payingMembership}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Plan BLACK'}
                    </button>
                  </div>

                  {/* PLAN FLEX */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#34D399', fontWeight: 900, fontSize: '0.9rem' }}>Plan FLEX</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Fin de Semana (Vie·Sáb·Dom)</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#34D399', fontWeight: 900, fontSize: '1.1rem' }}>
                          <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: '6px', fontSize: '0.85rem' }}>{formatCLP(flexNormalPrice)}</span>
                          {formatCLP(flexPromoPrice)}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/fin de semana</div>
                      </div>
                    </div>
                    <button
                      className="btn btn-accent btn-block"
                      onClick={() => handlePayMembership('FLEX')}
                      disabled={payingMembership}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {payingMembership ? <span className="spinner-sm"></span> : 'Pagar Plan FLEX'}
                    </button>
                  </div>

                  {/* PLAN COMFORT */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '0.9rem' }}>Plan COMFORT</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>Cuota Diaria de Operación</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#60A5FA', fontWeight: 900, fontSize: '1.1rem' }}>
                          <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: '6px', fontSize: '0.85rem' }}>{formatCLP(comfortNormalPrice)}</span>
                          {formatCLP(comfortPromoPrice)}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>/día</div>
                      </div>
                    </div>

                    <button
                      className="btn btn-accent btn-block"
                      onClick={() => handlePayMembership('COMFORT')}
                      disabled={payingMembership}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {payingMembership ? <span className="spinner-sm"></span> : 'Pagar con Mercado Pago'}
                    </button>

                    <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                        O realiza transferencia bancaria y sube el comprobante:
                        <br /><strong>Banco:</strong> Banco Estado | <strong>Cta Corriente:</strong> 987654321
                        <br /><strong>RUT:</strong> 76.543.210-K | <strong>Destinatario:</strong> Fim SpA
                        <br /><strong>Email:</strong> pagos@fim.cl
                      </div>

                      <label style={{ display: 'block', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {uploadingReceipt ? (
                            'Subiendo comprobante...'
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Office-Drawer--Streamline-Ultimate" height="16" width="16" style={{ flexShrink: 0 }}>
                                <desc>Office Drawer Streamline Icon: https://streamlinehq.com</desc>
                                <path fill="#e3e3e3" d="M2.9126 8.65216V3.86955c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06642 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86957" strokeWidth={1}></path>
                                <path fill="#ffffff" d="M2.9126 12.4781V7.69554c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06641 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86952" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.9126 12.4781V7.69554c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06641 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637v2.86952" strokeWidth={1}></path>
                                <path fill="#e3bfb3" d="M1 13.4347c0 -0.2537 0.10078 -0.497 0.28016 -0.6764 0.17938 -0.1793 0.42267 -0.2802 0.67636 -0.2802H22.0435c0.2536 0 0.497 0.1009 0.6763 0.2802 0.1794 0.1794 0.2802 0.4227 0.2802 0.6764v6.6956c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1793 -0.4227 0.2801 -0.6763 0.2801H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2801C1.10078 20.6273 1 20.384 1 20.1303v-6.6956Z" strokeWidth={1}></path>
                                <path fill="#c77f67" d="M22.0435 18.2174H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2802C1.10078 17.7579 1 17.5145 1 17.2609v2.8695c0 0.2537 0.10078 0.497 0.28016 0.6764 0.17938 0.1793 0.42267 0.2801 0.67636 0.2801H22.0435c0.2536 0 0.497 -0.1008 0.6763 -0.2801 0.1794 -0.1794 0.2802 -0.4227 0.2802 -0.6764v-2.8695c0 0.2536 -0.1008 0.497 -0.2802 0.6763 -0.1793 0.1794 -0.4227 0.2802 -0.6763 0.2802Z" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1 13.4347c0 -0.2537 0.10078 -0.497 0.28016 -0.6764 0.17938 -0.1793 0.42267 -0.2802 0.67636 -0.2802H22.0435c0.2536 0 0.497 0.1009 0.6763 0.2802 0.1794 0.1794 0.2802 0.4227 0.2802 0.6764v6.6956c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1793 -0.4227 0.2801 -0.6763 0.2801H1.95652c-0.25369 0 -0.49698 -0.1008 -0.67636 -0.2801C1.10078 20.6273 1 20.384 1 20.1303v-6.6956Z" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.9126 4.82607v-0.95652c0 -0.25369 0.10078 -0.49698 0.28015 -0.67637 0.17939 -0.17938 0.42268 -0.28016 0.67637 -0.28016h8.13048c0.1484 0 0.2949 0.03457 0.4277 0.10098 0.1329 0.06642 0.2484 0.16283 0.3375 0.28163l1.1478 1.53044H20.13c0.2537 0 0.497 0.10078 0.6763 0.28015 0.1794 0.17939 0.2802 0.42268 0.2802 0.67637" strokeWidth={1}></path>
                                <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M9.13037 15.3477h5.73913" strokeWidth={1}></path>
                              </svg>
                              Subir Comprobante de Transferencia
                            </>
                          )}
                        </span>
                        <input type="file" accept="image/*" onChange={(e) => { handleReceiptUpload(e); setShowPaymentModal(false); }} disabled={uploadingReceipt} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button className="btn btn-secondary btn-block" onClick={() => setShowPaymentModal(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE SOS / EMERGENCIA */}
      {showSafetyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '2px solid var(--danger)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '440px',
            padding: '28px',
            boxShadow: '0px 0px 30px rgba(255, 69, 96, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)', animation: 'pulseSOS 1.5s infinite' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: 'var(--danger)' }}>ALERTA DE SEGURIDAD</h2>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Se reportará una emergencia silenciosa al equipo de soporte de FIM y se registrará tu ubicación GPS actual.
              </p>
            </div>

            {!safetySent ? (
              <>
                <div style={{
                  background: 'rgba(255, 69, 96, 0.08)',
                  border: '1px solid rgba(255, 69, 96, 0.2)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  color: 'white'
                }}>
                  {safetyCountdown > 0 ? (
                    <span>Enviando reporte automático en <strong style={{ color: 'var(--danger)', fontSize: '1.3rem' }}>{safetyCountdown}</strong> segundos...</span>
                  ) : (
                    <span>Enviando reporte silencioso...</span>
                  )}
                </div>

                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo de Incidente</label>
                  <select
                    className="form-input"
                    value={safetyReason}
                    onChange={(e) => setSafetyReason(e.target.value)}
                    style={{ background: '#1A1A28', color: 'white', border: '1px solid var(--border)' }}
                  >
                    <option value="Incidente de seguridad / Amenaza">Incidente de seguridad / Amenaza</option>
                    <option value="Accidente de tránsito / Colisión">Accidente de tránsito / Colisión</option>
                    <option value="Pasajero agresivo o sospechoso">Pasajero agresivo o sospechoso</option>
                    <option value="Intento de asalto o robo">Intento de asalto o robo</option>
                    <option value="Otro motivo urgente">Otro motivo urgente</option>
                  </select>
                </div>

                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Detalles adicionales (opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: El pasajero está muy alterado..."
                    value={safetyDescription}
                    onChange={(e) => setSafetyDescription(e.target.value)}
                    style={{ background: '#1A1A28', color: 'white', border: '1px solid var(--border)' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href="tel:133"
                    className="btn btn-danger btn-block"
                    style={{
                      background: '#FF3B30',
                      color: 'white',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      padding: '12px',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    📞 LLAMAR A CARABINEROS (133)
                  </a>

                  <button
                    type="button"
                    className="btn btn-accent btn-block"
                    disabled={safetySending}
                    onClick={triggerSafetyReport}
                  >
                    {safetySending ? 'Enviando...' : 'Confirmar Reporte Silencioso Ahora'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    style={{ color: 'var(--text-muted)' }}
                    onClick={() => {
                      setShowSafetyModal(false);
                      setSafetySent(false);
                    }}
                  >
                    Cancelar y volver al viaje
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  background: 'rgba(0, 229, 160, 0.08)',
                  border: '1px solid rgba(0, 229, 160, 0.2)',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--accent)'
                }}>
                  ✓ Reporte Silencioso Recibido por FIM.
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    Hemos registrado tus coordenadas y el historial de viaje. Nuestro equipo de soporte está auditando el caso.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href="tel:133"
                    className="btn btn-danger btn-block"
                    style={{
                      background: '#FF3B30',
                      color: 'white',
                      fontWeight: 900,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      padding: '12px',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    📞 LLAMAR A CARABINEROS (133)
                  </a>

                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => {
                      setShowSafetyModal(false);
                      setSafetySent(false);
                    }}
                  >
                    Volver al viaje
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE PERFIL DE CONDUCTOR */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          overflowY: 'auto',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '460px',
            padding: '28px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            margin: 'auto'
          }}>

            <button
              onClick={() => setShowProfileModal(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                transition: 'var(--transition)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <IconX />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'var(--gold-light)',
                color: 'var(--accent)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconUser />
              </div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Mi Perfil</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Nombre Completo</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.name || '—'}</div>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Correo Electrónico</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.email || '—'}</div>
              </div>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>Número de Teléfono</span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{session?.user?.phone || '—'}</div>
              </div>
            </div>

            {driver && (
              <div style={{
                background: driver.membershipPlan === 'BLACK'
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)'
                  : driver.membershipPlan === 'COMFORT'
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)',
                border: `1.5px solid ${driver.membershipPlan === 'BLACK'
                  ? 'rgba(212,175,55,0.35)'
                  : driver.membershipPlan === 'COMFORT'
                    ? 'rgba(59,130,246,0.35)'
                    : 'rgba(16,185,129,0.35)'
                  }`,
                borderRadius: '12px',
                padding: '16px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: driver.membershipPlan === 'BLACK'
                  ? '0 6px 20px rgba(212,175,55,0.06)'
                  : driver.membershipPlan === 'COMFORT'
                    ? '0 6px 20px rgba(59,130,246,0.06)'
                    : '0 6px 20px rgba(16,185,129,0.06)'
              }}>

                {/* Glow/Light effect */}
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle, ${driver.membershipPlan === 'BLACK'
                    ? 'rgba(212,175,55,0.15)'
                    : driver.membershipPlan === 'COMFORT'
                      ? 'rgba(59,130,246,0.15)'
                      : 'rgba(16,185,129,0.15)'
                    } 0%, transparent 70%)`,
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    padding: '4px 10px',
                    background: driver.membershipPlan === 'BLACK' ? '#D4AF37' : driver.membershipPlan === 'COMFORT' ? '#3B82F6' : '#10B981',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    color: driver.membershipPlan === 'BLACK' ? '#000' : '#fff',
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {driver.membershipPlan === 'BLACK' && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    )}
                    PLAN {driver.membershipPlan}
                  </div>

                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: driver.membershipPlan === 'BLACK' ? '#D4AF37' : driver.membershipPlan === 'COMFORT' ? '#60A5FA' : '#34D399'
                  }}>
                    {driver.membershipPlan === 'BLACK' && `${formatCLP(parseInt(config.membership_black_promo_price || '49990', 10))} / mes`}
                    {driver.membershipPlan === 'COMFORT' && `${formatCLP(parseInt(config.membership_comfort_promo_price || '8990', 10))} / día`}
                    {driver.membershipPlan === 'FLEX' && `${formatCLP(parseInt(config.membership_flex_promo_price || '19990', 10))} / finde`}
                  </div>
                </div>

                {driver.isPromoActive && (
                  <div style={{
                    background: 'rgba(212,175,55,0.1)',
                    border: '1px solid rgba(212,175,55,0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: '#D4AF37',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: '13px', height: '13px', flexShrink: 0, color: '#D4AF37' }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>FREE PASS Activo ({getRemainingFreePassDays()} días)</span>
                    </div>
                    <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal', fontSize: '0.72rem' }}>
                      Pase libre vence: <strong>{getFreePassExpirationDate()}</strong>
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 'normal', fontSize: '0.72rem' }}>
                      Membresía estimada (+30 días): <strong>{getEstimatedPaidExpirationDate()}</strong>
                    </div>
                  </div>
                )}

                {!driver.isPromoActive && driver.membershipPaid && driver.membershipExpiresAt && new Date(driver.membershipExpiresAt) > new Date() && (
                  <div style={{
                    background: 'rgba(0, 229, 160, 0.1)',
                    border: '1px solid rgba(0, 229, 160, 0.2)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    color: '#00E5A0',
                    fontWeight: 700,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', flexShrink: 0, color: '#00E5A0' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Membresía Activa</span>
                    </div>
                    <div style={{ marginTop: '4px', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal', fontSize: '0.72rem' }}>
                      Vence el: <strong>{new Date(driver.membershipExpiresAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                  {/* Advantages list */}
                  {(driver.membershipPlan === 'BLACK' ? [
                    'Acceso ilimitado 30 días seguidos',
                    'Sin cobros diarios ni interrupciones',
                    'Conserva el 100% de tus tarifas',
                    'Renovación mensual automática'
                  ] : driver.membershipPlan === 'COMFORT' ? [
                    'Financiado: inicia sin capital',
                    `Paga ${formatCLP(parseInt(config.membership_comfort_promo_price || '8990', 10))} solo los días operados`,
                    'Conserva el 100% de tus tarifas'
                  ] : [
                    'Activo Viernes, Sábado y Domingo',
                    'Ideal para complementar tus ingresos',
                    'Conserva el 100% de tus tarifas',
                    'Sin cobros durante la semana'
                  ]).map((advantage, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <span style={{
                        color: driver.membershipPlan === 'BLACK' ? '#D4AF37' : driver.membershipPlan === 'COMFORT' ? '#60A5FA' : '#34D399',
                        fontWeight: 900
                      }}>✓</span>
                      <span>{advantage}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconShieldLock size={16} />
                Cambiar Contraseña
              </h4>

              <input
                type="password"
                placeholder="Contraseña actual"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />
              <input
                type="password"
                placeholder="Confirmar nueva contraseña"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1.5px solid var(--border)',
                  color: 'white',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.85rem'
                }}
              />

              {passwordChangeMsg && (
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: passwordChangeStatus === 'success' ? 'var(--success)' : 'var(--danger)',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: passwordChangeStatus === 'success' ? 'rgba(0, 229, 160, 0.08)' : 'rgba(255, 69, 96, 0.08)',
                  border: '1px solid ' + (passwordChangeStatus === 'success' ? 'rgba(0, 229, 160, 0.2)' : 'rgba(255, 69, 96, 0.2)'),
                  padding: '8px 12px',
                  borderRadius: '8px'
                }}>
                  <IconCheck />
                  <span>{passwordChangeMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={passwordChangeLoading || !currentPassword || !newPassword || !confirmNewPassword}
                style={{
                  width: '100%',
                  marginTop: '6px',
                  padding: '12px',
                  fontWeight: 700,
                  borderRadius: '10px'
                }}
              >
                {passwordChangeLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleDeleteAccount}
                className="btn"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  background: 'rgba(255, 69, 96, 0.1)',
                  color: 'var(--danger)',
                  border: '1px solid rgba(255, 69, 96, 0.2)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 69, 96, 0.15)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 69, 96, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 69, 96, 0.2)'; }}
              >
                Quiero Borrar mi cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTAS Y CONFIRMACIONES PERSONALIZADAS ESTILO FIM */}
      {customDialog.show && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '380px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '16px',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: customDialog.type === 'error' ? 'rgba(255, 69, 96, 0.1)' : customDialog.type === 'success' ? 'rgba(0, 229, 160, 0.1)' : 'rgba(255, 193, 7, 0.1)',
              color: customDialog.type === 'error' ? '#FF4560' : customDialog.type === 'success' ? '#00E5A0' : '#FFC107',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {customDialog.type === 'error' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              ) : customDialog.type === 'success' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              )}
            </div>
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.1rem', marginBottom: '8px' }}>{customDialog.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{customDialog.message}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
              {customDialog.isConfirm ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setCustomDialog(prev => ({ ...prev, show: false }));
                      if (customDialog.onCancel) customDialog.onCancel();
                    }}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setCustomDialog(prev => ({ ...prev, show: false }));
                      if (customDialog.onConfirm) customDialog.onConfirm();
                    }}
                    style={{ flex: 1 }}
                  >
                    Confirmar
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setCustomDialog(prev => ({ ...prev, show: false }));
                    if (customDialog.onConfirm) customDialog.onConfirm();
                  }}
                  style={{ width: '100%' }}
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REGALO DE DÍAS (FREE PASS FIM) */}
      {showGiftModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.95)',
          backdropFilter: 'blur(16px)',
          zIndex: 12000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div className="card animate-scale-in" style={{
            width: '100%',
            maxWidth: '440px',
            border: '2px solid #FFD700', // Golden border
            background: 'linear-gradient(145deg, #151522 0%, #0D0D15 100%)',
            padding: '32px 24px',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(255, 215, 0, 0.15)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255, 215, 0, 0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 215, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px auto',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)',
                animation: 'pulse 2s infinite'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
                  <path d="M20 12v10H4V12" />
                  <path d="M2 7h20v5H2z" />
                  <path d="M12 22V7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>

              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 900,
                color: '#FFD700',
                margin: '0 0 16px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
                lineHeight: '1.3'
              }}>
                ¡FELICIDADES! GANASTE {giftDaysAmount} DÍAS DE FREE PASS
              </h2>

              <div style={{
                fontSize: '1.1rem',
                color: '#FFD700',
                fontWeight: 800,
                marginBottom: '24px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: 'rgba(255, 215, 0, 0.1)',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'inline-block',
                border: '1px solid rgba(255, 215, 0, 0.2)'
              }}>
                FREE PASS quedan {getRemainingDaysForModal()} días
              </div>

              <p style={{
                fontSize: '1.25rem',
                lineHeight: '1.6',
                color: '#FFFFFF',
                margin: '0 0 32px 0',
                fontWeight: 500
              }}>
                Te hemos regalado <strong style={{ color: '#FFD700', fontSize: '1.45rem', fontWeight: 800 }}>{giftDaysAmount} días</strong>, premiando tu compromiso con FIM.
                <span style={{ display: 'block', marginTop: '16px', fontStyle: 'italic', color: '#00E5A0', fontWeight: 600 }}>
                  ¡Maneje con cuidado jefe! 🚗💨
                </span>
              </p>

              <button 
                onClick={() => setShowGiftModal(false)}
                className="btn btn-accent btn-lg btn-block"
                style={{
                  background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                  color: '#000000',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 20px rgba(255, 215, 0, 0.3)',
                  cursor: 'pointer',
                  padding: '16px',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.3)';
                }}
              >
                ENTENDIDO, GRACIAS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIONES */}
      {showNotificationsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 9, 15, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 11500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease'
        }}>
          <div className="card animate-scale-in" style={{
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            background: '#0D0D15',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Notificaciones
              </h3>
              <button 
                onClick={() => setShowNotificationsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A0A0B0',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <IconX />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#A0A0B0' }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', opacity: 0.4 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No tienes notificaciones por el momento.</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                  <button 
                    onClick={markAllNotificationsAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Marcar todas como leídas
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   {notifications.map((n: any) => (
                    <div key={n.id} style={{
                      padding: '12px 16px',
                      background: n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255, 215, 0, 0.04)',
                      border: `1px solid ${n.read ? 'rgba(255,255,255,0.05)' : 'rgba(255, 215, 0, 0.2)'}`,
                      borderRadius: '12px',
                      position: 'relative',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        marginTop: '2px',
                        color: n.read ? '#A0A0B0' : '#FFD700',
                        flexShrink: 0
                      }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                          <path d="M20 12v10H4V12" />
                          <path d="M2 7h20v5H2z" />
                          <path d="M12 22V7" />
                          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        {!n.read && (
                          <span style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#FFD700'
                          }} />
                        )}
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: 'white', lineHeight: '1.4', paddingRight: '16px' }}>
                          {n.text}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: '#A0A0B0' }}>
                          {new Date(n.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => setShowNotificationsModal(false)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '20px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <BiometricModal
        isOpen={showBiometricModal}
        onClose={() => {
          setShowBiometricModal(false);
        }}
        onSuccess={() => {
          localStorage.setItem('driver_biometric_last_verified', String(Date.now()));
          setShowBiometricModal(false);
          handleToggleOnline();
        }}
        selfieUrl={driver?.selfieUrl}
      />
    </div>
  );
}
