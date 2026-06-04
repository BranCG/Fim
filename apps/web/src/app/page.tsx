'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';
import SplashScreen from '@/components/SplashScreen';
import { getSession } from '@/lib/api';

const SingleNeutralCircleIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    id="Single-Neutral-Circle--Streamline-Ultimate" 
    height={height} 
    width={width}
    style={style}
  >
    <desc>
      Single Neutral Circle Streamline Icon: https://streamlinehq.com
    </desc>
    <path fill="#c2f3ff" d="M12.0001 23c6.0733 0 10.9972 -4.9239 10.9972 -10.9972 0 -6.07331 -4.9239 -10.99718 -10.9972 -10.99718 -6.07329 0 -10.99717 4.92387 -10.99717 10.99718C1.00293 18.0761 5.92681 23 12.0001 23Z" strokeWidth={1}></path>
    <path fill="#66e1ff" d="M12.0001 5.55652c2.5213 0.00022 4.9658 0.86676 6.9244 2.45446 1.9585 1.5877 3.312 3.80012 3.8338 6.26682 0.3396 -1.6021 0.3171 -3.2599 -0.0659 -4.85222s-1.1167 -3.079 -2.1477 -4.35147c-1.031 -1.27248 -2.3332 -2.29861 -3.8115 -3.00347C15.2549 1.36579 13.6379 1 12.0001 1c-1.6377 0 -3.25475 0.36579 -4.73303 1.07064 -1.47829 0.70486 -2.78048 1.73099 -3.81148 3.00347 -1.031 1.27247 -1.76478 2.75915 -2.14776 4.35147C0.924863 11.0179 0.902371 12.6757 1.242 14.2778c0.52178 -2.4667 1.87528 -4.67912 3.8338 -6.26682 1.95851 -1.5877 4.4031 -2.45424 6.9243 -2.45446Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0001 23c6.0733 0 10.9972 -4.9239 10.9972 -10.9972 0 -6.07331 -4.9239 -10.99718 -10.9972 -10.99718 -6.07329 0 -10.99717 4.92387 -10.99717 10.99718C1.00293 18.0761 5.92681 23 12.0001 23Z" strokeWidth={1}></path>
    <path fill="#ffdda1" d="M12.0005 9.61208c0.8242 0 1.6148 -0.32744 2.1976 -0.91029 0.5828 -0.58284 0.9103 -1.37335 0.9103 -2.19762 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0 0.82427 0.32744 1.61478 0.91028 2.19762 0.58284 0.58285 1.37334 0.91029 2.19764 0.91029Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="m13.9561 20.6093 0.4351 -2.3907h1.9126v-2.8688c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604s-2.23583 0.4534 -3.04284 1.2604c-0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v2.8688h1.91255l0.43508 2.3907" strokeWidth={1}></path>
    <path fill="#ffdda1" d="M12.0005 5.30883c0.655 0.00133 1.2927 0.21033 1.8214 0.59694s0.9212 0.93093 1.121 1.55468c0.1052 -0.30792 0.1617 -0.63114 0.1655 -0.95628 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0.00382 0.32514 0.06024 0.64836 0.16543 0.95628 0.19986 -0.62375 0.59236 -1.16807 1.12109 -1.55468 0.5287 -0.38661 1.1664 -0.59561 1.8214 -0.59694Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0005 9.61208c0.8242 0 1.6148 -0.32744 2.1976 -0.91029 0.5828 -0.58284 0.9103 -1.37335 0.9103 -2.19762 0 -0.82426 -0.3275 -1.61477 -0.9103 -2.19762 -0.5828 -0.58284 -1.3734 -0.91028 -2.1976 -0.91028 -0.8243 0 -1.6148 0.32744 -2.19764 0.91028 -0.58284 0.58285 -0.91028 1.37336 -0.91028 2.19762 0 0.82427 0.32744 1.61478 0.91028 2.19762 0.58284 0.58285 1.37334 0.91029 2.19764 0.91029Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="M12.0005 11.0465c-1.1413 0 -2.23583 0.4534 -3.04284 1.2604 -0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v1.9125c0 -0.5651 0.1113 -1.1247 0.32756 -1.6468s0.53324 -0.9964 0.93283 -1.396c0.39959 -0.3996 0.87398 -0.7166 1.39604 -0.9329 0.5221 -0.2162 1.0817 -0.3275 1.6468 -0.3275 0.5651 0 1.1247 0.1113 1.6468 0.3275 0.5221 0.2163 0.9965 0.5333 1.3961 0.9329 0.3996 0.3996 0.7165 0.8739 0.9328 1.396 0.2163 0.5221 0.3276 1.0817 0.3276 1.6468v-1.9125c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m13.9561 20.6093 0.4351 -2.3907h1.9126v-2.8688c0 -1.1413 -0.4534 -2.2359 -1.2604 -3.0429 -0.807 -0.807 -1.9016 -1.2604 -3.0429 -1.2604s-2.23583 0.4534 -3.04284 1.2604c-0.80702 0.807 -1.26039 1.9016 -1.26039 3.0429v2.8688h1.91255l0.43508 2.3907" strokeWidth={1}></path>
  </svg>
);

const CarIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Car-4--Streamline-Ultimate" height={height} width={width} style={style}>
    <desc>Car 4 Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#ff808c" d="M4.82609 9.13043H19.1739c1.0148 0 1.9879 0.40311 2.7055 1.12067 0.7175 0.7175 1.1206 1.6907 1.1206 2.7054v4.7826c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1794 -0.4226 0.2801 -0.6763 0.2801H1.95652c-0.25368 0 -0.49698 -0.1007 -0.67636 -0.2801C1.10078 18.2361 1 17.9928 1 17.7391v-4.7826c0 -1.0147 0.4031 -1.9879 1.12063 -2.7054 0.71754 -0.71756 1.69072 -1.12067 2.70546 -1.12067Z" strokeWidth={1}></path>
    <path fill="#ffbfc5" d="M22.8801 12c-0.2121 -0.8215 -0.6913 -1.5491 -1.362 -2.06857 -0.6708 -0.51944 -1.4952 -0.80121 -2.3436 -0.801H4.82666c-0.8484 -0.00021 -1.6728 0.28156 -2.34358 0.801C1.8123 10.4509 1.33319 11.1785 1.12109 12H22.8801Z" strokeWidth={1}></path>
    <path fill="#ffef5e" d="M2.9141 13.913h2.86957L5.3054 12H1.12158c-0.06504 0.2554 -0.10522 0.5165 -0.1167 0.7796 0.18509 0.3446 0.46066 0.6323 0.79708 0.8321 0.33641 0.1997 0.72092 0.3039 1.11214 0.3013Z" strokeWidth={1}></path>
    <path fill="#ffef5e" d="m18.696 12 -0.4782 1.913h2.8695c0.3919 0.0019 0.7769 -0.1027 1.1138 -0.3027 0.337 -0.2 0.6132 -0.4878 0.7993 -0.8326 -0.0135 -0.2627 -0.0539 -0.5233 -0.1205 -0.7777H18.696Z" strokeWidth={1}></path>
    <path fill="#66e1ff" d="m4.34766 9.13044 0.68965 -4.13983c0.07445 -0.44784 0.30574 -0.8546 0.65252 -1.14759 0.34678 -0.29298 0.78646 -0.45309 1.24044 -0.45171H17.0761c0.4527 0.00017 0.8906 0.16086 1.236 0.45352 0.3454 0.29265 0.5758 0.6983 0.6503 1.14482l0.6896 4.14079H4.34766Z" strokeWidth={1}></path>
    <path fill="#c2f3ff" d="M15.3477 3.3913H6.93026c-0.45346 -0.00044 -0.89233 0.16022 -1.23834 0.45332 -0.346 0.2931 -0.57664 0.69958 -0.65079 1.14694l-0.69347 4.13887h5.26087L15.3477 3.3913Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M4.82609 9.13043H19.1739c1.0148 0 1.9879 0.40311 2.7055 1.12067 0.7175 0.7175 1.1206 1.6907 1.1206 2.7054v4.7826c0 0.2537 -0.1008 0.497 -0.2802 0.6764 -0.1793 0.1794 -0.4226 0.2801 -0.6763 0.2801H1.95652c-0.25368 0 -0.49698 -0.1007 -0.67636 -0.2801C1.10078 18.2361 1 17.9928 1 17.7391v-4.7826c0 -1.0147 0.4031 -1.9879 1.12063 -2.7054 0.71754 -0.71756 1.69072 -1.12067 2.70546 -1.12067Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m4.34766 9.13043 0.68965 -4.14079c0.07449 -0.44668 0.30503 -0.85246 0.6506 -1.14513 0.34557 -0.29267 0.78376 -0.45327 1.23662 -0.45321H17.0751c0.4529 -0.00006 0.8911 0.16054 1.2366 0.45321 0.3456 0.29267 0.5762 0.69845 0.6507 1.14513l0.6896 4.14079" strokeWidth={1}></path>
    <path fill="#ff808c" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m19.6523 9.13042 1.4348 -1.91304h1.4348c0.1269 0 0.2485 0.05038 0.3382 0.14008 0.0897 0.08969 0.1401 0.21133 0.1401 0.33818v0.95652c0 0.12684 -0.0504 0.24849 -0.1401 0.33818 -0.0897 0.08969 -0.2113 0.14008 -0.3382 0.14008h-2.8696Z" strokeWidth={1}></path>
    <path fill="#ff808c" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M4.34783 9.13042 2.91304 7.21738H1.47826c-0.12684 0 -0.24849 0.05038 -0.33818 0.14008C1.05039 7.44715 1 7.56879 1 7.69564v0.95652c0 0.12684 0.05039 0.24849 0.14008 0.33818 0.08969 0.08969 0.21134 0.14008 0.33818 0.14008h2.86957Z" strokeWidth={1}></path>
    <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M5.78214 18.6956v0.9566c0 0.2537 -0.10077 0.497 -0.28016 0.6763 -0.17938 0.1794 -0.42267 0.2802 -0.67636 0.2802H2.91258c-0.25369 0 -0.49698 -0.1008 -0.67637 -0.2802 -0.17938 -0.1793 -0.28016 -0.4226 -0.28016 -0.6763v-0.9566h3.82609Z" strokeWidth={1}></path>
    <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.0439 18.6956v0.9566c0 0.2537 -0.1008 0.497 -0.2802 0.6763 -0.1794 0.1794 -0.4227 0.2802 -0.6764 0.2802h-1.913c-0.2537 0 -0.497 -0.1008 -0.6764 -0.2802 -0.1794 -0.1793 -0.2801 -0.4226 -0.2801 -0.6763v-0.9566h3.8261Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.8799 12H18.696l-0.4782 1.913h2.8695c0.3916 0.0022 0.7764 -0.102 1.1133 -0.3015 0.3369 -0.1994 0.6134 -0.4867 0.7998 -0.831" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1.12052 12h4.18383l0.47826 1.913H2.91304c-0.39173 0.0032 -0.77689 -0.1007 -1.11399 -0.3002 -0.3371 -0.1996 -0.61337 -0.4873 -0.79905 -0.8323" strokeWidth={1}></path>
    <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m18.2177 13.913 -1.9532 0.7796c-0.2965 0.1071 -0.6083 0.1674 -0.923 0.177H8.17425c-0.31329 -0.012 -0.62127 -0.0848 -0.90678 -0.2143l-1.48452 -0.7423L5.30469 12H18.696l-0.4783 1.913Z" strokeWidth={1}></path>
    <path fill="#b2b2b2" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="m5.30469 18.6957 0.95652 -1.9131H17.7395l0.9565 1.9131H5.30469Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M17.7393 16.7826h3.3478" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M2.91309 16.7826h3.34782" strokeWidth={1}></path>
  </svg>
);

const EarthPinIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Earth-Pin-2--Streamline-Ultimate" height={height} width={width} style={style}>
    <desc>Earth Pin 2 Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#e3e3e3" d="M20.6085 10.087c0 6.6956 -8.6087 12.913 -8.6087 12.913s-8.60869 -6.2174 -8.60869 -12.913C3.39111 5.06902 6.9809 1 11.9998 1c5.0189 0 8.6087 4.06902 8.6087 9.087Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="M11.9998 23s-8.60869 -6.2174 -8.60869 -12.913C3.39111 5.06902 6.9809 1 11.9998 1v22Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M20.6085 10.087c0 6.6956 -8.6087 12.913 -8.6087 12.913s-8.60869 -6.2174 -8.60869 -12.913C3.39111 5.06902 6.9809 1 11.9998 1c5.0189 0 8.6087 4.06902 8.6087 9.087Z" strokeWidth={1}></path>
    <path fill="#66e1ff" d="M11.9996 15.3478c4.418 -0.0002 7.1793 -4.7829 4.9701 -8.60886 -1.0252 -1.77562 -2.9198 -2.86937 -4.9701 -2.86937 -4.41795 0 -7.17917 4.78261 -4.97019 8.60873 1.02523 1.7758 2.91973 2.8696 4.97019 2.8695Z" strokeWidth={1}></path>
    <path fill="#78eb7b" d="M11.0434 10.5642c0 -0.5282 -0.4283 -0.95648 -0.9565 -0.95648 -0.52823 0 -0.95651 -0.42819 -0.95651 -0.95652 0 -0.79235 -0.64243 -1.43469 -1.43479 -1.43478h-0.91445c-0.85706 1.87449 -0.64458 4.06438 0.55673 5.73908h1.31425c1.32068 0 2.39127 -1.0706 2.39127 -2.3913Z" strokeWidth={1}></path>
    <path fill="#78eb7b" d="M15.7954 5.30338c-1.3145 0.00312 -2.3746 1.07696 -2.3607 2.3913 0 0.52833 0.4283 0.95652 0.9565 0.95652 0.5283 0 0.9565 0.42829 0.9565 0.95652 0 0.79248 0.6424 1.43488 1.4348 1.43478h0.7758c0.5373 -2.09234 -0.1437 -4.30922 -1.7629 -5.73912Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.9996 15.3478c4.418 -0.0002 7.1793 -4.7829 4.9701 -8.60886 -1.0252 -1.77562 -2.9198 -2.86937 -4.9701 -2.86937 -4.41795 0 -7.17917 4.78261 -4.97019 8.60873 1.02523 1.7758 2.91973 2.8696 4.97019 2.8695Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M6.78125 7.21739h0.91445c0.79245 0 1.43479 0.64234 1.43479 1.43478 0 0.52824 0.42828 0.95653 0.95651 0.95653 0.5282 0 0.9565 0.4283 0.9565 0.9565 0 1.3207 -1.07059 2.3912 -2.39127 2.3913H7.33798" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M17.5583 11.0435h-0.7757c-0.7925 0 -1.4348 -0.6424 -1.4348 -1.4348 0 -0.52823 -0.4283 -0.95652 -0.9565 -0.95652 -0.5283 0 -0.9566 -0.42829 -0.9566 -0.95652 -0.0154 -1.31542 1.0462 -2.39033 2.3617 -2.39131" strokeWidth={1}></path>
  </svg>
);

const LockShieldIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Lock-Shield--Streamline-Ultimate" height={height} width={width} style={style}>
    <desc>Lock Shield Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#e3e3e3" d="M21.584 1.50781c0.1198 0 0.2385 0.02362 0.3492 0.06952 0.1107 0.04589 0.2113 0.11316 0.296 0.19795 0.0847 0.08479 0.1519 0.18545 0.1977 0.29621 0.0458 0.11077 0.0693 0.22947 0.0692 0.34932l-0.0074 6.90617c0.0202 3.05412 -1.0028 6.02372 -2.8997 8.41752 -1.8969 2.3937 -4.554 4.0683 -7.5319 4.7467 -2.98404 -0.6509 -5.65647 -2.3008 -7.57535 -4.6769 -1.91888 -2.3761 -2.96924 -5.336 -2.97736 -8.39015l0.01192 -6.99875c-0.00012 -0.11986 0.02338 -0.23856 0.06917 -0.34932 0.04578 -0.11077 0.11294 -0.21143 0.19765 -0.29622 0.08471 -0.08479 0.18529 -0.15205 0.29601 -0.19795 0.11072 -0.04589 0.2294 -0.06951 0.34925 -0.06951L21.584 1.50781Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="M12.0048 1.50781H2.42564c-0.24142 0.00097 -0.47261 0.09762 -0.64289 0.26876 -0.17028 0.17114 -0.26577 0.40282 -0.26552 0.64424l-0.01284 7.00334c0.00794 3.04495 1.05185 5.99655 2.96006 8.36935 1.90821 2.3729 4.56711 4.0257 7.53945 4.6867l0.0009 -20.97239Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M21.584 1.50781c0.1198 0 0.2385 0.02362 0.3492 0.06952 0.1107 0.04589 0.2113 0.11316 0.296 0.19795 0.0847 0.08479 0.1519 0.18545 0.1977 0.29621 0.0458 0.11077 0.0693 0.22947 0.0692 0.34932l-0.0074 6.90617c0.0202 3.05412 -1.0028 6.02372 -2.8997 8.41752 -1.8969 2.3937 -4.554 4.0683 -7.5319 4.7467 -2.98404 -0.6509 -5.65647 -2.3008 -7.57535 -4.6769 -1.91888 -2.3761 -2.96924 -5.336 -2.97736 -8.39015l0.01192 -6.99875c-0.00012 -0.11986 0.02338 -0.23856 0.06917 -0.34932 0.04578 -0.11077 0.11294 -0.21143 0.19765 -0.29622 0.08471 -0.08479 0.18529 -0.15205 0.29601 -0.19795 0.11072 -0.04589 0.2294 -0.06951 0.34925 -0.06951L21.584 1.50781Z" strokeWidth={1}></path>
    <path fill="#ffef5e" d="M16.1249 14.2624c0.0006 0.1202 -0.0226 0.2394 -0.0682 0.3506 -0.0456 0.1113 -0.1128 0.2124 -0.1976 0.2976 -0.0849 0.0852 -0.1857 0.1528 -0.2968 0.1988 -0.1111 0.0461 -0.2301 0.0697 -0.3504 0.0696l-6.38639 0.0284c-0.24111 0 -0.47241 -0.0954 -0.64333 -0.2655 -0.17092 -0.17 -0.26755 -0.4009 -0.26876 -0.642l-0.02475 -5.35879c0 -0.2419 0.0961 -0.47389 0.26714 -0.64494 0.17105 -0.17105 0.40305 -0.26714 0.64495 -0.26714l6.38644 -0.02842c0.2411 0 0.4724 0.09546 0.6433 0.26552s0.2675 0.40088 0.2688 0.64198l0.0256 5.35429Z" strokeWidth={1}></path>
    <path fill="#fff9bf" d="m12.0048 8.00977 -3.20746 0.01466c-0.2419 0 -0.47389 0.0961 -0.64494 0.26715 -0.17105 0.17104 -0.26715 0.40304 -0.26715 0.64494L7.91 14.2953c0.00122 0.2412 0.09784 0.472 0.26876 0.642 0.17092 0.1701 0.40222 0.2656 0.64333 0.2655l3.18271 -0.0091V8.00977Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M16.1249 14.2624c0.0006 0.1202 -0.0226 0.2394 -0.0682 0.3506 -0.0456 0.1113 -0.1128 0.2124 -0.1976 0.2976 -0.0849 0.0852 -0.1857 0.1528 -0.2968 0.1988 -0.1111 0.0461 -0.2301 0.0697 -0.3504 0.0696l-6.38639 0.0284c-0.24111 0 -0.47241 -0.0954 -0.64333 -0.2655 -0.17092 -0.17 -0.26755 -0.4009 -0.26876 -0.642l-0.02475 -5.35879c0 -0.2419 0.0961 -0.47389 0.26714 -0.64494 0.17105 -0.17105 0.40305 -0.26714 0.64495 -0.26714l6.38644 -0.02842c0.2411 0 0.4724 0.09546 0.6433 0.26552s0.2675 0.40088 0.2688 0.64198l0.0256 5.35429Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.9725 4.24502c-0.7256 0.00388 -1.42 0.29574 -1.9305 0.81141 -0.51052 0.51567 -0.79538 1.21296 -0.79197 1.93859v1.02667l5.47337 -0.02384V6.97027c-0.0033 -0.72603 -0.295 -1.42098 -0.8107 -1.93204 -0.5157 -0.51106 -1.2141 -0.79638 -1.9402 -0.79321Z" strokeWidth={1}></path>
    <path fill="#808080" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M12.0065 12.7425c0.3027 0 0.5929 -0.1202 0.807 -0.3342 0.214 -0.2141 0.3342 -0.5044 0.3342 -0.807 0 -0.3027 -0.1202 -0.593 -0.3342 -0.807 -0.2141 -0.214 -0.5043 -0.3343 -0.807 -0.3343 -0.3027 0 -0.593 0.1203 -0.807 0.3343 -0.214 0.214 -0.3343 0.5043 -0.3343 0.807 0 0.3026 0.1203 0.5929 0.3343 0.807 0.214 0.214 0.5043 0.3342 0.807 0.3342Z" strokeWidth={1}></path>
  </svg>
);

const WirelessPaymentIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Wireless-Payment-Credit-Card-Dollar--Streamline-Ultimate" height={height} width={width} style={style}>
    <desc>Wireless Payment Credit Card Dollar Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#66e1ff" d="M14.3913 4.82611H1V19.1739h13.3913V4.82611Z" strokeWidth={1}></path>
    <path fill="#66e1ff" d="M14.3913 4.82611H1V19.1739h13.3913V4.82611Z" strokeWidth={1}></path>
    <path fill="#c2f3ff" d="M1.00488 17.235 13.4138 4.82611H1.00488V17.235Z" strokeWidth={1}></path>
    <path fill="#ffffff" d="M1 21.087v-1.913h13.3913v1.913c-0.0015 0.5069 -0.2036 0.9926 -0.562 1.3511 -0.3585 0.3584 -0.8442 0.5604 -1.3511 0.5619H2.91304c-0.50691 -0.0015 -0.99261 -0.2035 -1.35106 -0.5619 -0.35843 -0.3585 -0.56047 -0.8442 -0.56198 -1.3511Z" strokeWidth={1}></path>
    <path fill="#ffffff" stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M14.3913 2.91304v1.91304H1V2.91304c0.00151 -0.50691 0.20355 -0.99261 0.56198 -1.35106 0.35845 -0.35843 0.84415 -0.56047 1.35106 -0.56198h9.56516c0.5069 0.00151 0.9926 0.20355 1.3511 0.56198 0.3584 0.35845 0.5605 0.84415 0.562 1.35106Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M14.3926 11.5218V4.82611" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M1 4.82611V21.087c0.00151 0.5068 0.20355 0.9925 0.56198 1.351 0.35845 0.3584 0.84415 0.5605 1.35106 0.562h4.7826" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M7.69564 19.174H1" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M5.78418 2.91309h3.82608" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M6.37012 12.574c-0.00056 0.2634 0.07709 0.5211 0.22311 0.7404 0.14602 0.2192 0.35385 0.3902 0.59714 0.4913 0.2433 0.101 0.5111 0.1275 0.7695 0.0762 0.25838 -0.0514 0.49572 -0.1782 0.68193 -0.3645 0.18621 -0.1864 0.31291 -0.4239 0.36405 -0.6823 0.05114 -0.2584 0.02441 -0.5262 -0.07679 -0.7694 -0.10121 -0.2432 -0.27234 -0.4509 -0.49171 -0.5968 -0.21937 -0.1459 -0.47709 -0.2233 -0.74054 -0.2226 -0.26277 -0.0017 -0.51916 -0.0811 -0.73683 -0.2284 -0.21767 -0.1472 -0.38686 -0.3555 -0.48625 -0.5989 -0.09938 -0.2432 -0.12451 -0.51046 -0.0722 -0.76799 0.0523 -0.25752 0.1797 -0.49379 0.36612 -0.67901 0.18641 -0.18521 0.4235 -0.31108 0.68136 -0.36173 0.25786 -0.05065 0.52494 -0.0238 0.76755 0.07715 0.24262 0.10096 0.44992 0.27149 0.59574 0.49011 0.14582 0.21861 0.22364 0.47551 0.22364 0.7383" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M7.69629 13.9036v0.8857" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M7.69629 7.69568v0.88765" strokeWidth={1}></path>
    <path fill="#ffef5e" d="M21.0866 13.4348h-9.5652c-0.5068 0.0015 -0.9925 0.2036 -1.351 0.562 -0.35845 0.3585 -0.56049 0.8442 -0.562 1.3511v5.7391c0.00151 0.5068 0.20355 0.9926 0.562 1.3511 0.3585 0.3584 0.8442 0.5604 1.351 0.5619h9.5652c0.5074 0 0.994 -0.2015 1.3528 -0.5603 0.3587 -0.3588 0.5603 -0.8454 0.5603 -1.3527v-5.7391c0 -0.5074 -0.2016 -0.994 -0.5603 -1.3528 -0.3588 -0.3587 -0.8454 -0.5603 -1.3528 -0.5603Z" strokeWidth={1}></path>
    <path fill="#fff9bf" d="M11.5214 13.4348c-0.5068 0.0015 -0.9925 0.2036 -1.351 0.562 -0.35845 0.3585 -0.56049 0.8442 -0.562 1.3511v5.7391c0.00082 0.2642 0.0567 0.5254 0.16408 0.7668 0.10738 0.2414 0.26392 0.4579 0.45952 0.6354l9.0545 -9.0544h-7.7651Z" strokeWidth={1}></path>
  </svg>
);

const SignBadgeIcon = ({ width = 24, height = 24, style }: { width?: number | string; height?: number | string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Sign-Badge-Badge-1--Streamline-Ultimate" height={height} width={width} style={style}>
    <desc>Sign Badge Badge 1 Streamline Icon: https://streamlinehq.com</desc>
    <path fill="#ffef5e" d="M11.9999 23s9.596 -2.399 9.596 -8.6365c0 -3.3586 -2.8788 -4.3182 -2.8788 -6.71723 0 -1.44522 1.6314 -2.88937 2.4384 -3.51608 0.0537 -0.04168 0.0979 -0.09439 0.1296 -0.15452 0.0319 -0.06014 0.0505 -0.12632 0.0548 -0.19416 0.0043 -0.06785 -0.006 -0.13589 -0.03 -0.19953 -0.024 -0.06355 -0.0613 -0.12144 -0.1093 -0.16957l-2.2244 -2.2243c-0.0743 -0.07419 -0.1707 -0.12193 -0.2747 -0.13588 -0.1041 -0.01406 -0.2098 0.00634 -0.3011 0.05818l-3.0419 1.73778 -3.1206 -1.78386C12.1649 1.02216 12.0822 1 11.9979 1c-0.0842 0 -0.1669 0.02216 -0.2398 0.06433L8.64126 2.84819 5.60029 1.11041c-0.09137 -0.05203 -0.19729 -0.07263 -0.30154 -0.05858 -0.10416 0.01406 -0.2009 0.06189 -0.27519 0.13628l-2.2244 2.2243c-0.04803 0.04823 -0.08532 0.10602 -0.10933 0.16957 -0.02402 0.06364 -0.03427 0.13168 -0.02997 0.19953 0.00429 0.06784 0.02294 0.13412 0.05466 0.19416 0.03183 0.06013 0.07605 0.11284 0.12974 0.15462 0.807 0.62661 2.43838 2.07076 2.43838 3.51598 0 2.39903 -2.87883 3.35863 -2.87883 6.71723C2.40381 20.601 11.9999 23 11.9999 23Z" strokeWidth={1}></path>
    <path fill="#fff9bf" d="M11.9999 1.00195c-0.0834 0.0001 -0.1654 0.02158 -0.238 0.06238L8.64126 2.84819 5.60029 1.11041c-0.09137 -0.05203 -0.19729 -0.07263 -0.30154 -0.05857 -0.10416 0.01405 -0.2009 0.06188 -0.27519 0.13627l-2.2244 2.22431c-0.04803 0.04822 -0.08532 0.10601 -0.10933 0.16956 -0.02402 0.06364 -0.03427 0.13168 -0.02997 0.19953 0.00429 0.06784 0.02294 0.13403 0.05466 0.19416 0.03183 0.06013 0.07605 0.11284 0.12974 0.15462 0.807 0.62661 2.43838 2.07076 2.43838 3.51598 0 2.39903 -2.87883 3.35863 -2.87883 6.71723C2.40381 20.601 11.9999 23 11.9999 23V1.00195Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M11.9999 23s9.596 -2.399 9.596 -8.6365c0 -3.3586 -2.8788 -4.3182 -2.8788 -6.71723 0 -1.44522 1.6314 -2.88937 2.4384 -3.51608 0.0537 -0.04168 0.0979 -0.09439 0.1296 -0.15452 0.0319 -0.06014 0.0505 -0.12632 0.0548 -0.19416 0.0043 -0.06785 -0.006 -0.13589 -0.03 -0.19953 -0.024 -0.06355 -0.0613 -0.12144 -0.1093 -0.16957l-2.2244 -2.2243c-0.0743 -0.07419 -0.1707 -0.12193 -0.2747 -0.13588 -0.1041 -0.01406 -0.2098 0.00634 -0.3011 0.05818l-3.0419 1.73778 -3.1206 -1.78386C12.1649 1.02216 12.0822 1 11.9979 1c-0.0842 0 -0.1669 0.02216 -0.2398 0.06433L8.64126 2.84819 5.60029 1.11041c-0.09137 -0.05203 -0.19729 -0.07263 -0.30154 -0.05858 -0.10416 0.01406 -0.2009 0.06189 -0.27519 0.13628l-2.2244 2.2243c-0.04803 0.04823 -0.08532 0.10602 -0.10933 0.16957 -0.02402 0.06364 -0.03427 0.13168 -0.02997 0.19953 0.00429 0.06784 0.02294 0.13412 0.05466 0.19416 0.03183 0.06013 0.07605 0.11284 0.12974 0.15462 0.807 0.62661 2.43838 2.07076 2.43838 3.51598 0 2.39903 -2.87883 3.35863 -2.87883 6.71723C2.40381 20.601 11.9999 23 11.9999 23Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.9997 15.3479v0.9565H9.6084v-0.9565c0.00151 -0.5069 0.20355 -0.9926 0.562 -1.3511 0.3585 -0.3584 0.8442 -0.5605 1.351 -0.562h9.5652c0.5074 0 0.994 0.2016 1.3528 0.5603 0.3587 0.3588 0.5603 0.8454 0.5603 1.3528Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M22.9997 16.3044v4.7826c0 0.5073 -0.2016 0.9939 -0.5603 1.3527 -0.3588 0.3588 -0.8454 0.5603 -1.3528 0.5603h-9.5652c-0.5068 -0.0015 -0.9925 -0.2035 -1.351 -0.5619 -0.35845 -0.3585 -0.56049 -0.8443 -0.562 -1.3511v-4.7826h13.3913Z" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M16.3051 18.2173h-4.7826" strokeWidth={1}></path>
    <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" d="M13.4355 20.1305h-1.913" strokeWidth={1}></path>
  </svg>
);

const TypewriterText = ({ 
  text, 
  highlightText, 
  fontFamily = "'Outfit', var(--font-sans)"
}: { 
  text: string; 
  highlightText?: string;
  fontFamily?: string;
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(80);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleType = () => {
      if (!isDeleting) {
        setDisplayText(text.substring(0, displayText.length + 1));
        setTypingSpeed(80);

        if (displayText === text) {
          timer = setTimeout(() => setIsDeleting(true), 3000);
          return;
        }
      } else {
        setDisplayText(text.substring(0, displayText.length - 1));
        setTypingSpeed(40);

        if (displayText === '') {
          setIsDeleting(false);
          setTypingSpeed(500);
        }
      }
    };

    timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, text, typingSpeed]);

  if (highlightText && text.includes(highlightText)) {
    const parts = text.split(highlightText);
    const beforeText = parts[0];
    
    if (displayText.length <= beforeText.length) {
      return (
        <h1 style={{ 
          fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
          fontWeight: 900, 
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '16px',
          fontFamily,
          minHeight: '2.2em'
        }}>
          {displayText}
          <span className="typewriter-cursor" style={{ marginLeft: '4px', animation: 'blink 0.8s infinite', color: 'var(--accent)' }}>|</span>
        </h1>
      );
    } else {
      const typedHighlight = displayText.substring(beforeText.length);
      return (
        <h1 style={{ 
          fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
          fontWeight: 900, 
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '16px',
          fontFamily,
          minHeight: '2.2em'
        }}>
          {beforeText}
          <span className="text-gradient">{typedHighlight}</span>
          <span className="typewriter-cursor" style={{ marginLeft: '4px', animation: 'blink 0.8s infinite', color: 'var(--accent)' }}>|</span>
        </h1>
      );
    }
  }

  return (
    <h1 style={{ 
      fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
      fontWeight: 900, 
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      marginBottom: '16px',
      fontFamily,
      minHeight: '2.2em'
    }}>
      {displayText}
      <span className="typewriter-cursor" style={{ marginLeft: '4px', animation: 'blink 0.8s infinite', color: 'var(--accent)' }}>|</span>
    </h1>
  );
};

const IconWalletColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="5" width="20" height="14" rx="3" fill="#FFB800" />
    <path d="M18 5h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2V5z" fill="#FFA500" />
    <path d="M2 8h16v4H2V8z" fill="#4FC3F7" opacity="0.8" />
    <circle cx="14" cy="14" r="2" fill="#FF4560" />
  </svg>
);

const IconLinkColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="3" y="11" width="12" height="8" rx="2" transform="rotate(-45 3 11)" fill="#4FC3F7" />
    <rect x="11" y="19" width="12" height="8" rx="2" transform="rotate(-45 11 19)" fill="#00E5A0" />
    <rect x="8" y="12" width="8" height="3" rx="1.5" transform="rotate(-45 8 12)" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const IconProfileColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="3" width="20" height="18" rx="3" fill="#FF4560" />
    <circle cx="12" cy="9" r="4" fill="#FFB800" />
    <path d="M6 19c0-3.314 2.686-6 6-6s6 2.686 6 6H6z" fill="#FFFFFF" opacity="0.9" />
  </svg>
);

const IconCheckColor = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="#10B981" />
    <circle cx="12" cy="12" r="4" fill="#00E5A0" />
    <path d="M12 8l-2 2h4l-2-2z" fill="#FFFFFF" />
    <circle cx="19" cy="6" r="5" fill="#FFB800" />
    <path d="M17.5 6l1 1 2-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  const router = useRouter();
  const [tripsPerWeek, setTripsPerWeek] = useState(60);
  const [avgPrice, setAvgPrice] = useState(6000);
  const [loss, setLoss] = useState(0);
  const [activeView, setActiveView] = useState<'passenger' | 'driver'>('passenger');

  useEffect(() => {
    const s = getSession();
    if (s && s.user && s.user.role) {
      if (s.user.role === 'admin') {
        router.push('/admin');
      } else if (s.user.role === 'driver') {
        router.push('/driver');
      } else {
        router.push('/passenger');
      }
    }
  }, [router]);

  useEffect(() => {
    // Calculamos pérdida semanal asumiendo 25% de comisión
    const calculatedLoss = Math.round(tripsPerWeek * avgPrice * 0.25);
    setLoss(calculatedLoss);
  }, [tripsPerWeek, avgPrice]);

  const formatCLP = (val: number) => {
    return '$' + val.toLocaleString('es-CL');
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-primary)',
      ...(activeView === 'driver' ? {
        '--accent': '#8B5CF6',
        '--accent-dark': '#7C3AED',
        '--accent-light': 'rgba(139, 92, 246, 0.15)',
        '--border-accent': 'rgba(139, 92, 246, 0.3)',
        '--shadow-accent': '0 4px 24px rgba(139, 92, 246, 0.25)',
        '--text-accent': '#C084FC',
      } as React.CSSProperties : {})
    }}>
      <SplashScreen />
      
      {/* Promo Ribbon */}
      <div style={{
        background: activeView === 'passenger' 
          ? 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
          : 'linear-gradient(90deg, var(--accent) 0%, #6D28D9 100%)',
        color: '#000',
        textAlign: 'center',
        padding: '8px 24px',
        fontSize: '0.9rem',
        fontWeight: 800,
        position: 'relative',
        zIndex: 101,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        letterSpacing: '0.05em',
        transition: 'all 0.3s ease'
      }}>
        {activeView === 'passenger' 
          ? '¡VIAJA SIN COMISIONES INTERMEDIAS! PAGA EL PRECIO JUSTO DIRECTO AL CONDUCTOR'
          : '¡0% COMISIÓN! CONDUCE BAJO TUS PROPIAS REGLAS Y QUÉDATE CON EL 100%'}
      </div>

      {/* Navbar */}
      <nav className="navbar-container" style={{
        padding: 'var(--nav-padding, 16px 24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(9, 9, 15, 0.8)',
      }}>
        <Logo className="navbar-logo" />
        <div style={{ display: 'flex', gap: 'var(--nav-gap, 12px)', alignItems: 'center' }}>
          <Link href="/login" className="btn btn-secondary btn-sm navbar-btn">Iniciar sesión</Link>
          <Link href="/register" className="btn btn-primary btn-sm navbar-btn">Registrarse</Link>
        </div>
      </nav>

      {/* Elegant Mode Switch */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '32px',
        marginBottom: '16px',
        position: 'relative',
        zIndex: 10,
        gap: '8px'
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 800 }}>Selecciona tu modo</span>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          padding: '4px',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          width: '280px',
          height: '46px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
          cursor: 'pointer'
        }} onClick={() => setActiveView(activeView === 'passenger' ? 'driver' : 'passenger')}>
          {/* Sliding pill */}
          <div style={{
            position: 'absolute',
            top: '4px',
            left: activeView === 'passenger' ? '4px' : 'calc(50% + 0px)',
            width: 'calc(50% - 4px)',
            height: 'calc(100% - 8px)',
            background: 'var(--accent)',
            borderRadius: '100px',
            boxShadow: 'var(--shadow-accent)',
            transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }} />
          
          {/* Labels */}
          <div style={{
            width: '50%',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: activeView === 'passenger' ? '#09090F' : 'var(--text-muted)',
            zIndex: 2,
            transition: 'color 0.3s ease',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <SingleNeutralCircleIcon width={18} height={18} style={{ display: 'inline-block', flexShrink: 0 }} />
            Pasajero
          </div>
          <div style={{
            width: '50%',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: activeView === 'driver' ? '#09090F' : 'var(--text-muted)',
            zIndex: 2,
            transition: 'color 0.3s ease',
            userSelect: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <CarIcon width={18} height={18} style={{ display: 'inline-block', flexShrink: 0 }} />
            Conductor
          </div>
        </div>
      </div>

      {/* Main Hero Container */}
      <section style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          left: '-200px',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        
        {activeView === 'passenger' ? (
          /* PASAJERO HERO */
          <div key="passenger-hero" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              Viajes Económicos y Directos
            </div>

            <TypewriterText 
              text="Viaja sin comisiones intermedias. Paga el precio justo." 
              highlightText="Paga el precio justo." 
            />

            <p style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              maxWidth: '750px', 
              lineHeight: 1.6, 
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              Fim conecta pasajeros con conductores profesionales e independientes en Santiago. Al no cobrar comisiones por carrera, obtienes tarifas más baratas y el 100% de tu pago va directo al conductor.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <Link href="/register?role=passenger" className="btn btn-primary btn-lg" style={{ minWidth: '240px' }}>
                Quiero Viajar
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '240px' }}>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        ) : (
          /* CONDUCTOR HERO */
          <div key="driver-hero" style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 24px',
            textAlign: 'center',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              background: 'var(--accent-light)',
              border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--accent)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}>
              Disponible en Santiago
            </div>

            <h1 style={{ 
              fontSize: 'clamp(2.3rem, 7vw, 4rem)', 
              fontWeight: 900, 
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              marginBottom: '16px',
              fontFamily: "'Outfit', var(--font-sans)"
            }}>
              La red de conductores independientes <span className="text-gradient">más rentable</span> de Chile.
            </h1>

            <p style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)', 
              maxWidth: '750px', 
              lineHeight: 1.6, 
              color: 'var(--text-secondary)',
              marginBottom: '32px'
            }}>
              ¿Trabajas todo el día para regalarle el 25% de tu esfuerzo a una aplicación? En Fim eso se acabó: aquí tus tarifas son 100% líquidas para ti. Pagas tu membresía fija diaria o mensual y todo lo demás va directo a tu cuenta.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
              <Link href="/register?role=driver" className="btn btn-primary btn-lg" style={{ minWidth: '240px' }}>
                Quiero Conducir
              </Link>
              <Link href="/login" className="btn btn-secondary btn-lg" style={{ minWidth: '240px' }}>
                Iniciar Sesión
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* AMBIENTE PASAJERO */}
      {activeView === 'passenger' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Beneficio Pasajero Section */}
          <section style={{ 
            padding: '60px 24px', 
            background: 'linear-gradient(135deg, rgba(0,229,160,0.08) 0%, rgba(9,9,15,1) 100%)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>El Trato Más Justo</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                Tarifas más bajas, sin comisiones
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '24px', lineHeight: 1.6 }}>
                Al eliminar el 25% de comisión que cobran otras plataformas, los pasajeros de Fim viajan más barato y los conductores independientes reciben el 100% de lo pagado de manera directa.
              </p>
              <Link href="/register?role=passenger" className="btn btn-accent btn-lg" style={{ boxShadow: 'var(--shadow-accent)' }}>
                Comenzar a viajar justo
              </Link>
            </div>
          </section>

          {/* Cómo Funciona Pasajero */}
          <section style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '48px', fontSize: '2rem', fontWeight: 900 }}>¿Cómo funciona Fim para Pasajeros?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
              {[
                {
                  icon: (
                    <EarthPinIcon width={36} height={36} />
                  ),
                  title: '1. Cotiza y Pide',
                  desc: 'Ingresa tu origen y destino. El sistema calculará la tarifa justa sin tarifas dinámicas especulativas.'
                },
                {
                  icon: (
                    <LockShieldIcon width={36} height={36} />
                  ),
                  title: '2. Código OTP Seguro',
                  desc: 'Al abordar el auto, indícale al conductor tu código de seguridad OTP exclusivo para autorizar el viaje.'
                },
                {
                  icon: (
                    <WirelessPaymentIcon width={36} height={36} />
                  ),
                  title: '3. Pago Directo',
                  desc: 'Paga con tarjeta mediante el enlace de Mercado Pago del conductor o en efectivo. Sin cargos extra de intermediación.'
                },
                {
                  icon: (
                    <SignBadgeIcon width={36} height={36} />
                  ),
                  title: '4. Viajes Regulados',
                  desc: 'Viaja con conductores profesionales validados con estricto control de identidad y documentación al día.'
                }
              ].map((step, idx) => (
                <div key={idx} className="card" style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)', padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>{step.icon}</div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{step.title}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Final Pasajero */}
          <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(0,229,160,0.03) 100%)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>Comienza a viajar hoy</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Tarifas más bajas, mayor seguridad y un trato justo a quienes te transportan.
            </p>
            <Link href="/register?role=passenger" className="btn btn-primary btn-lg" style={{ minWidth: '260px' }}>
              Registrarme para Viajar
            </Link>
          </section>
        </div>
      )}

      {/* AMBIENTE CONDUCTOR */}
      {activeView === 'driver' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>

          {/* Línea de Tiempo del Conductor */}
          <section style={{ padding: '80px 24px', background: 'linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '12px' }}>PROCESO DE ACTIVACIÓN</div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'white' }}>
                  Línea de Tiempo del Conductor
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.95rem' }}>
                  Sigue estos 3 sencillos pasos para registrarte, activar tu cuenta y comenzar a conducir con Fim.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>
                {/* Center line for timeline on desktop */}
                <div style={{
                  position: 'absolute',
                  left: '20px',
                  top: '10px',
                  bottom: '10px',
                  width: '2px',
                  background: 'linear-gradient(to bottom, var(--accent) 0%, rgba(255,255,255,0.05) 100%)',
                  zIndex: 0
                }} />

                {[
                  {
                    step: '1',
                    title: 'Registro y Validación Biométrica',
                    desc: 'Regístrate como Conductor en Fim. Sube tu licencia de conducir profesional y pasa la verificación de identidad para garantizar la seguridad de la comunidad.'
                  },
                  {
                    step: '2',
                    title: 'Vincula tu Mercado Pago',
                    desc: 'Pega tu enlace de cobro de Mercado Pago en la app. Los pasajeros te pagarán directamente a tu cuenta al finalizar cada viaje.'
                  },
                  {
                    step: '3',
                    title: 'Elige tu Plan y Comienza a Conducir',
                    desc: 'Selecciona la membresía que mejor se adapte a tu ritmo de trabajo (diaria o mensual). ¡Todo lo que generes en los viajes es 100% tuyo!'
                  }
                ].map((item) => (
                  <div key={item.step} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'var(--bg-primary)',
                      border: '2px solid var(--accent)',
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '1.1rem',
                      flexShrink: 0,
                      boxShadow: 'var(--shadow-accent)'
                    }}>
                      {item.step}
                    </div>
                    <div className="card" style={{ flex: 1, padding: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{item.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Calculadora de Pérdida */}
          <section id="calculator" style={{ padding: '80px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: 1.2, fontWeight: 800 }}>
                  ¿Cuánto dinero <span style={{ color: '#ff4757' }}>estás perdiendo</span> en comisiones?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '32px' }}>
                  En otras aplicaciones, el 25% o más de tu trabajo se lo quedan ellos. Calcula cuánto queda en tu bolsillo con Fim.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Viajes por semana <span style={{ color: 'var(--accent)', fontWeight: 800 }}>{tripsPerWeek}</span>
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="150" 
                      value={tripsPerWeek}
                      onChange={(e) => setTripsPerWeek(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valor promedio por viaje ($)</label>
                    <input 
                      type="number" 
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(parseInt(e.target.value) || 0)}
                      className="form-input" 
                      style={{ fontSize: '1.2rem', padding: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="calc-card" style={{ 
                background: 'var(--bg-secondary)', 
                padding: '36px', 
                borderRadius: 'var(--radius-lg)', 
                border: '2px solid var(--border)',
                textAlign: 'center',
                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#ff4757'
                }} />
                <div style={{ fontSize: '0.9rem', color: '#ff4757', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.1em' }}>Pérdida semanal estimada</div>
                <div className="calc-loss-text" style={{ fontSize: 'var(--calc-loss-font-size, 3.5rem)', fontWeight: 900, marginBottom: '24px', color: '#ff4757', letterSpacing: '-0.02em' }}>{formatCLP(loss)}</div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '1rem' }}>Con Fim, este dinero es <strong>100% tuyo</strong>.</p>
                  <Link href="/register?role=driver" className="btn btn-primary btn-block btn-lg calc-btn" style={{ fontSize: '1.1rem' }}>Empezar a ganar de verdad</Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PLANES DE MEMBRESÍA — Aparece primero, como segunda sección    */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <section id="planes" style={{ padding: '80px 24px', background: 'var(--bg-primary)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(0,229,160,0.1)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-full)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '20px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="14" x2="8" y2="14.01" /><line x1="12" y1="14" x2="16" y2="14" /></svg>
                  Membresías de Conductor
                </div>
                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '16px' }}>
                  Elige tu plan. <span className="text-gradient">0% comisión por viaje.</span>
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                  Solo pagas tu membresía. Todo lo que generes en la calle es 100% tuyo, al instante.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'stretch' }}>

                {/* ── PLAN BLACK ────────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 50%, #0d0d1a 100%)',
                  border: '2px solid rgba(212,175,55,0.7)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(212,175,55,0.2), 0 0 0 1px rgba(212,175,55,0.15)',
                  transform: 'scale(1.02)',
                  zIndex: 2,
                }}>
                  {/* Badge MÁS POPULAR */}
                  <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', padding: '6px 20px', borderRadius: '0 0 10px 10px', fontSize: '0.72rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    MÁS POPULAR
                  </div>

                  {/* Glow efecto */}
                  <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #D4AF37, #B8960C)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#000', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      PLAN BLACK
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', fontSize: '0.7rem', color: '#D4AF37', fontWeight: 800 }}>
                      PREMIUM
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#D4AF37', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      $150.000
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>por mes — pago único mensual</div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(212,175,55,0.4)', paddingLeft: '12px' }}>
                    Pagas una vez al mes. Acceso ilimitado los 30 días. Sin cobros diarios, sin restricciones de días.
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Acceso ilimitado 30 días completos',
                      '✓  Sin pagos diarios ni interrupciones',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Pago vía Mercado Pago (automático)',
                      '✓  Renovación mensual simple',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#D4AF37', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(212,175,55,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Pago seguro con Mercado Pago — activación instantánea
                    </div>
                    <Link href="/register?role=driver&plan=BLACK" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                      color: '#000', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(212,175,55,0.3)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan BLACK →
                    </Link>
                  </div>
                </div>

                {/* ── PLAN COMFORT ──────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #0a0f1a 0%, #0f1e35 50%, #0a1020 100%)',
                  border: '1px solid rgba(59,130,246,0.4)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(59,130,246,0.1)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                      PLAN COMFORT
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '20px', fontSize: '0.7rem', color: '#60A5FA', fontWeight: 800 }}>
                      FINANCIADO
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#FBBF24', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        $180.000
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', paddingBottom: '6px' }}>/mes total</div>
                    </div>
                    <div style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Cuota diaria:</span>
                      <span style={{ color: '#60A5FA', fontWeight: 800, fontSize: '0.85rem' }}>$20.000 /día operado</span>
                    </div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(59,130,246,0.5)', paddingLeft: '12px' }}>
                    <strong>Membresía Crédito:</strong> Te financiamos la membresía de inicio para que empieces sin capital. Pagas $20.000 por día trabajado hasta completar la meta de $180.000. ¡Al cumplir la meta, el resto del mes es 100% gratis!
                  </p>

                  <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '14px', fontSize: '0.82rem' }}>
                    <div style={{ color: '#FBBF24', fontWeight: 800, marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ¿Cómo funciona?
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                      Pagas la cuota diaria solo los días que trabajas. La subes en la app cada mañana para activarte. A las 7am del día siguiente se pausa hasta la nueva cuota.
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Crédito Fim (inicia sin capital)',
                      '✓  Solo pagas los días que trabajas',
                      '✓  Gratis al completar la meta mensual',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Comprobante diario verificado',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#60A5FA', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(59,130,246,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Transferencia bancaria diaria + comprobante en la app
                    </div>
                    <Link href="/register?role=driver&plan=COMFORT" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                      color: '#fff', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan COMFORT →
                    </Link>
                  </div>
                </div>

                {/* ── PLAN FLEX ─────────────────────────────────────────── */}
                <div style={{
                  background: 'linear-gradient(145deg, #050f0a 0%, #0a1f14 50%, #07120d 100%)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  borderRadius: '20px',
                  padding: '36px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 20px 60px rgba(16,185,129,0.08)',
                }}>
                  <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #10B981, #059669)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#fff', letterSpacing: '0.1em', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 2 22 22 22"/></svg>
                      PLAN FLEX
                    </div>
                    <div style={{ padding: '4px 12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', fontSize: '0.7rem', color: '#34D399', fontWeight: 800 }}>
                      FIN DE SEMANA
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, color: '#34D399', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      $60.000
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginTop: '6px' }}>por fin de semana (Vie → Dom)</div>
                  </div>

                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6, borderLeft: '2px solid rgba(16,185,129,0.4)', paddingLeft: '12px' }}>
                    Pensado para quienes solo trabajan el fin de semana. Pagas $60.000 y tienes acceso los Viernes, Sábado y Domingo. El resto de la semana la cuenta queda inactiva automáticamente.
                  </p>

                  <div style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
                        <div key={d} style={{
                          width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: i >= 4 ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${i >= 4 ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: i >= 4 ? '#34D399' : 'rgba(255,255,255,0.25)',
                          fontSize: '0.65rem', fontWeight: 800,
                        }}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} /> Activo
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)' }} /> Bloqueado
                      </span>
                    </div>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      '✓  Activo solo Viernes, Sábado y Domingo',
                      '✓  Pago único semanal $60.000',
                      '✓  100% de cada carrera directo a ti',
                      '✓  Pago vía Mercado Pago (automático)',
                      '✓  Sin sorpresas ni cobros extras',
                    ].map(f => (
                      <li key={f} style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#34D399', fontWeight: 800 }}>{f.split('  ')[0]}</span>
                        <span>{f.split('  ')[1]}</span>
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid rgba(16,185,129,0.2)', paddingTop: '20px', marginTop: 'auto' }}>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textAlign: 'center' }}>
                      Pago seguro con Mercado Pago — activo el próximo viernes
                    </div>
                    <Link href="/register?role=driver&plan=FLEX" style={{
                      display: 'block', textAlign: 'center', padding: '14px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      color: '#fff', borderRadius: '10px', fontWeight: 900,
                      fontSize: '0.95rem', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(16,185,129,0.25)',
                      transition: 'all 0.2s ease',
                    }}>
                      Quiero el Plan FLEX →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Guía Mercado Pago */}
          <section style={{ padding: '80px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '40px', fontSize: '2rem', fontWeight: 900 }}>¿Cómo funciona FIM pagos?</h2>
              <div style={{ background: 'var(--bg-primary)', padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconWalletColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>Crea una cuenta en <strong>Mercado Pago</strong> (es gratis y personal).</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconLinkColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>En tu app de Mercado Pago, ve a <strong>Cobrar con Link</strong> y crea un link genérico o usa tu código QR.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconProfileColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>Pega ese link en tu perfil de <strong>Fim</strong> en la sección "Cobro Directo".</p>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <IconCheckColor />
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>¡Listo! Al terminar un viaje, el pasajero verá tu link y te pagará <strong>directo a tu cuenta</strong>.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Final Conductor */}
          <section style={{ padding: '80px 24px', textAlign: 'center', background: 'linear-gradient(180deg, var(--bg-primary) 0%, rgba(139,92,246,0.03) 100%)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px' }}>Comienza a ganar de verdad</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
              Únete a la comunidad de transporte independiente más justa de Chile.
            </p>
            <Link href="/register?role=driver" className="btn btn-primary btn-lg" style={{ minWidth: '260px' }}>
              Registrarme para Conducir
            </Link>
          </section>
        </div>
      )}

      {/* Footer */}
      <footer style={{ padding: '48px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: '#09090F' }}>
        <p style={{ marginBottom: '16px' }}>© 2026 Fim Platform. La red de conductores más rentable de Chile.</p>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
          <Link href="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Términos y Condiciones</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Políticas de Privacidad</Link>
        </div>
      </footer>
    </main>
  );
}
