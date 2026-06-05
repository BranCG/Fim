import sys

with open(r'apps\web\src\app\driver\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_pending_block = False
in_dashboard_promo = False
in_dashboard_payment = False
in_dashboard_link = False

i = 0
while i < len(lines):
    line = lines[i]

    # 1. Add icons and component before DriverPage
    if 'export default function DriverPage() {' in line:
        new_lines.append('''const IconProfileColor = () => (
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

''')
        new_lines.append(line)
        i += 1
        continue

    # 2. Add showMpTutorial
    if 'const [passengerConfirmed, setPassengerConfirmed] = useState(false);' in line:
        new_lines.append(line)
        new_lines.append('  const [showMpTutorial, setShowMpTutorial] = useState(false);\n')
        i += 1
        continue

    # 3. Handle pending screen replacement
    if "if (driver.status === 'pending') return (" in line:
        in_pending_block = True
        new_lines.append('''  if (driver.status === 'pending') return (
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
          
          <PaymentLinkTutorial showMpTutorial={showMpTutorial} setShowMpTutorial={setShowMpTutorial} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>
''')
        # Skip everything until we find the next '<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>'
        # Wait, the structure in the file has '<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>' right after the main card.
        # Let's just skip lines until we see a line containing '<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>'
        i += 1
        skipped = False
        while i < len(lines):
            if "<div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '440px' }}>" in lines[i]:
                skipped = True
                i += 1
                break
            i += 1
        if not skipped:
            # Fallback
            pass
        continue

    # 4. Handle dashboard promo card
    if "{driver.isPromoActive && (" in line:
        # Check if it's the dashboard promo card or somewhere else
        # It's at the start of the dashboard membership area
        if not in_dashboard_promo:
            in_dashboard_promo = True
            new_lines.append('''          {driver.isPromoActive && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.05) 100%)', 
              border: '1px solid #D4AF37', 
              borderRadius: '16px', 
              padding: '24px', 
              marginBottom: '20px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(212,175,55,0.1)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '3rem' }}>🎉</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D4AF37', margin: '0 0 12px 0' }}>¡Felicitaciones!</h2>
              <p style={{ fontSize: '0.95rem', color: '#fff', lineHeight: '1.5', margin: '0 0 16px 0', fontWeight: 600 }}>
                Bienvenido a FIM, la app que une a pasajeros y conductores más rentable del país.
              </p>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '4px' }}>Free PASS Activo</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Te quedan <strong style={{ color: '#fff' }}>{driver.freePassDays} días</strong></div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                Nuestra app es <strong>0% comisión</strong>, ¡A disfrutar jefe!
              </p>
            </div>
          )}
''')
            # Skip until the closing div and `)}`
            # Look for the exact end of the block
            while i < len(lines):
                if ")} " in lines[i] or ")}\n" in lines[i]:
                    # Need to check if it's the end of isPromoActive. The original was 13 lines.
                    pass
                if "<div style={{ background: 'rgba(212,175,55,0.2)', padding: '8px', borderRadius: '50%' }}>" in lines[i]:
                    pass # We know we are inside it
                if "          )}" in lines[i]:
                    i += 1
                    break
                i += 1
            continue

    if "{!driver.membershipPaid && !driver.isPromoActive && (" in line:
        in_dashboard_payment = True
        new_lines.append(line)
        i += 1
        continue

    # Add Mercado Pago link to dashboard under the membership section
    if "          {!driver.mercadoPagoLink &&" in line:
        # Avoid duplicate replacement if we do this
        pass
        
    # We will just inject the Mercado Pago dashboard panel right before the "Ponerse en línea" button!
    if "          <button" in line and "Ponerse en" in lines[i+5] if i+5 < len(lines) else False:
        # Wait, the "Ponerse en línea" button is lower down. Let's find it.
        pass
    
    if "            Ponerse en línea" in line or "            Desconectarse" in line:
        # Inject Mercado Pago link widget right above the online toggle button container
        pass

    new_lines.append(line)
    i += 1

# Let's fix the Mercado Pago dashboard injection manually
# Find the start of the button wrapper:
# <div style={{ display: 'flex', gap: '10px' }}>
#   <button className={`btn ${isOnline ? 'btn-danger' : 'btn-accent'} btn-block btn-lg`} onClick={handleToggleOnline} ...
# We want to put our code right before this div.
final_lines = []
for j, ln in enumerate(new_lines):
    if "<div style={{ display: 'flex', gap: '10px' }}>" in ln and "btn-danger" in new_lines[j+1]:
        final_lines.append('''
          {!driver.mercadoPagoLink && (
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
          )}

          <PaymentLinkTutorial showMpTutorial={showMpTutorial} setShowMpTutorial={setShowMpTutorial} />
''')
    final_lines.append(ln)

with open(r'apps\web\src\app\driver\page.tsx', 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("Done python fix")
