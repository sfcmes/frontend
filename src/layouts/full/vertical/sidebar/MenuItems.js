import {
  IconAward,
  IconBoxMultiple,
  IconPoint,
  IconAlertCircle,
  IconNotes,
  IconCalendar,
  IconMail,
  IconTicket,
  IconEdit,
  IconGitMerge,
  IconCurrencyDollar,
  IconApps,
  IconFileDescription,
  IconFileDots,
  IconFiles,
  IconBan,
  IconStar,
  IconMoodSmile,
  IconBorderAll,
  IconBorderHorizontal,
  IconBorderInner,
  IconBorderVertical,
  IconBorderTop,
  IconUserCircle,
  IconPackage,
  IconMessage2,
  IconBasket,
  IconChartLine,
  IconChartArcs,
  IconChartCandle,
  IconChartArea,
  IconChartDots,
  IconChartDonut3,
  IconChartRadar,
  IconLogin,
  IconUserPlus,
  IconRotate,
  IconBox,
  IconAperture,
  IconShoppingCart,
  IconHelp,
  IconBoxAlignBottom,
  IconBoxAlignLeft,
  IconLayout,
  IconZoomCode,
  IconSettings,
  IconBorderStyle2,
  IconAppWindow,
  IconLockAccess,
  IconHomePlus,
  IconBrandCodepen,
} from '@tabler/icons';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },
  {
    id: uniqueId(),
    title: 'ภาพรวมสถานะโครงการ',
    icon: IconAperture,
    href: '/dashboards/modern',
    chipColor: 'secondary',
  },
  {
    navlabel: true,
    subheader: 'นำเข้าข้อมูลพรีคาสท์สู่ระบบ',
    children:[
      {
        
      }
    ]
  },
  {
    id: uniqueId(),
    title: 'สร้างโครงการใหม่',
    icon: IconHomePlus,
    href: '/forms/form-project',
  },
  {
    id: uniqueId(),
    title: 'สร้างข้อมูลชั้นของโครงการ',
    icon: IconBrandCodepen,
    href: '/forms/form-section',
  },
  {
    id: uniqueId(),
    title: 'สร้างข้อมูลชิ้นงาน',
    icon: IconBrandCodepen,
    href: '/forms/form-component',
  },
  {
    navlabel: true,
    subheader: 'QR CODE',
    children:[
      {
        
      }
    ]
  },
  {
    id: uniqueId(),
    title: 'โปรแกรมอ่าน QR Code',
    icon: IconZoomCode,
    href: '/forms/form-qr-code-reader',
  },
  {
    id: uniqueId(),
    title: 'โปรแกรมสร้าง QR Code',
    icon: IconZoomCode,
    href: '/pages/qr-code',
  },
  {
    navlabel: true,
    subheader: 'OTHER',
  },
  {
    id: uniqueId(),
    title: 'COMPANY PROFILE',
    external: true,
    icon: IconStar,
    href: 'https://sfcmes.github.io/sangfahpc.com/',
  },
  {
    navlabel: true,
    subheader: 'Auth',
  },
 
  {
    id: uniqueId(),
    title: 'Login',
    icon: IconLogin,
    href: '/auth/login',
    children: [
      {
        id: uniqueId(),
        title: 'Boxed Login',
        icon: IconPoint,
        href: '/auth/login',
      },
    ],
  },
  {
    id: uniqueId(),
    title: 'ลงทะเบียนผู้ใช้งาน',
    icon: IconUserPlus,
    href: '/auth/register',
    children: [
      {
        id: uniqueId(),
        title: 'ลงทะเบียนผู้ใช้งาน',
        icon: IconPoint,
        href: '/auth/register',
      },
      {
        id: uniqueId(),
        title: 'ตั้งค่าผู้ใช้งาน',
        icon: IconPoint,
        href: '/auth/manageuser',
      },
    ],
  },
];

export default Menuitems;