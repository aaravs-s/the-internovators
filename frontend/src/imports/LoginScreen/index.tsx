import svgPaths from "./svg-xehnkl0roc";
import imgImage from "./bc878abcf97ed17d3e1c3e712df6c3c12b8ebe32.png";
import imgContainer from "./e837e8c85092ea24316f620931f3b7f43d27ff27.png";
import imgImageSwBadge from "./5ed1160c2f5847b95e35aad59c73cb9e16b4350c.png";
import imgImage1 from "./2d61b9f15906580ffd9e01376e83a2c50fc3ff8e.png";

function Image() {
  return (
    <div className="absolute h-[1085.594px] left-[-0.77px] top-[-47.19px] w-[1703.891px]" data-name="Image">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage} />
    </div>
  );
}

function DarkBackground() {
  return (
    <div className="absolute h-[944px] left-0 overflow-clip top-0 w-[1549px]" data-name="DarkBackground">
      <Image />
    </div>
  );
}

function ImageSwBadge() {
  return (
    <div className="absolute h-[87px] left-[110px] top-[110px] w-[130px]" data-name="Image (SW badge)">
      <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImageSwBadge} />
    </div>
  );
}

function Container2() {
  return (
    <div className="h-[196px] relative shrink-0 w-[240px]" data-name="Container">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-contain pointer-events-none size-full" src={imgContainer} />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <ImageSwBadge />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center relative size-full">
        <div className="[word-break:break-word] font-['Inter:Bold',sans-serif] font-bold leading-[0] not-italic relative shrink-0 text-[48px] text-center text-white tracking-[-1.2px] w-[282px]">
          <p className="leading-[60px] mb-0">Welcome to</p>
          <p className="leading-[60px]">SafeWalkers</p>
        </div>
      </div>
    </div>
  );
}

function Paragraph() {
  return (
    <div className="relative shrink-0 w-[281.813px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-center pt-[16px] relative size-full">
        <div className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[16px] text-[var(--text-note-subtitle)] text-center w-[282px]">
          <p className="leading-[26px] mb-0">Your trusted companion for safe</p>
          <p className="leading-[26px]">pedestrian routes.</p>
        </div>
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 w-[281.813px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Heading />
        <Paragraph />
      </div>
    </div>
  );
}

function Image1() {
  return (
    <div className="h-[36px] relative shrink-0 w-full" data-name="Image">
      <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 max-w-none object-contain pointer-events-none size-full" src={imgImage1} />
    </div>
  );
}

function Container4() {
  return (
    <div className="opacity-20 relative shrink-0 w-[50.406px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Image1 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[40px] items-center relative size-full">
        <Container2 />
        <Container3 />
        <Container4 />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col h-[944px] items-center justify-center left-0 px-[64px] top-0 w-[774.5px]" data-name="Container">
      <Container1 />
    </div>
  );
}

function Label() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.5px] not-italic relative shrink-0 text-[13px] text-[var(--map-marker-border)] tracking-[0.065px] whitespace-nowrap">Username</p>
      </div>
    </div>
  );
}

function TextInput() {
  return (
    <div className="absolute content-stretch flex flex-col h-[48px] items-start justify-center left-px overflow-clip px-[17px] top-px w-[382px]" data-name="Text Input">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[15px] text-[var(--grey-muted)] tracking-[-0.15px] w-full">Enter your username</p>
    </div>
  );
}

function Container8() {
  return (
    <div className="bg-[var(--option-bg-hover)] h-[50px] relative rounded-[14px] shrink-0 w-full" data-name="Container">
      <div aria-hidden className="absolute border border-[var(--select-border)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <TextInput />
    </div>
  );
}

function ContainerMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container (margin)">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[8px] relative size-full">
        <Container8 />
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Label />
        <ContainerMargin />
      </div>
    </div>
  );
}

function Label1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Label">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[19.5px] not-italic relative shrink-0 text-[13px] text-[var(--map-marker-border)] tracking-[0.065px] whitespace-nowrap">Password</p>
      </div>
    </div>
  );
}

function PasswordInput() {
  return (
    <div className="absolute content-stretch flex flex-col h-[48px] items-start justify-center left-px overflow-clip pl-[17px] pr-[50px] top-px w-[382px]" data-name="Password Input">
      <p className="[word-break:break-word] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[15px] text-[var(--grey-muted)] tracking-[-0.15px] w-full">Enter your password</p>
    </div>
  );
}

function EyeIcon() {
  return (
    <div className="relative shrink-0 size-[17px]" data-name="EyeIcon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
        <g id="EyeIcon">
          <path d={svgPaths.p58c8400} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" strokeWidth="1.41667" />
          <path d={svgPaths.p27765100} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" strokeWidth="1.41667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute content-stretch flex flex-col items-start justify-center left-[345px] opacity-60 p-[4px] top-[12.5px]" data-name="Button">
      <EyeIcon />
    </div>
  );
}

function Container10() {
  return (
    <div className="bg-[var(--option-bg-hover)] h-[50px] relative rounded-[14px] shrink-0 w-full" data-name="Container">
      <div aria-hidden className="absolute border border-[var(--select-border)] border-solid inset-0 pointer-events-none rounded-[14px]" />
      <PasswordInput />
      <Button />
    </div>
  );
}

function ContainerMargin1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container (margin)">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[8px] relative size-full">
        <Container10 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="relative shrink-0 w-[384px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[16px] relative size-full">
        <Label1 />
        <ContainerMargin1 />
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute h-[21px] left-0 top-[2px] w-[127px]" data-name="Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[21px] left-[63px] not-italic text-[var(--back-text-color)] text-[14px] text-center top-0 whitespace-nowrap">Forgot Password?</p>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <Button1 />
    </div>
  );
}

function ContainerMargin2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container (margin)">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[16px] relative size-full">
        <Container11 />
      </div>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <div className="relative shrink-0 size-[17px]" data-name="ArrowRightIcon">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
        <g id="ArrowRightIcon">
          <path d="M3.54167 8.5H13.4583" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.77083" />
          <path d={svgPaths.p82c4780} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.77083" />
        </g>
      </svg>
    </div>
  );
}

function Button2() {
  return (
    <div className="content-stretch drop-shadow-[0px_6px_7px_var(--primary-shadow)] flex gap-[8px] h-[52px] items-center justify-center relative rounded-[16px] shrink-0 w-[384px]" style={{ backgroundImage: "linear-gradient(179.019deg, rgb(176, 24, 72) 8.2137%, rgb(122, 15, 46) 91.786%)" }} data-name="Button">
      <p className="[word-break:break-word] font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] not-italic relative shrink-0 text-[16px] text-center text-white tracking-[-0.16px] whitespace-nowrap">Sign In</p>
      <ArrowRightIcon />
    </div>
  );
}

function ButtonMargin() {
  return (
    <div className="relative shrink-0 w-full" data-name="Button (margin)">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[20px] relative size-full">
        <Button2 />
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute h-[24px] left-[237px] top-0 w-[60px]" data-name="Button">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[24px] left-[30.5px] not-italic text-[16px] text-[var(--text-body)] text-center top-[-1px] whitespace-nowrap">Sign Up</p>
    </div>
  );
}

function Container12() {
  return (
    <div className="h-[24px] relative shrink-0 w-full" data-name="Container">
      <p className="-translate-x-1/2 [word-break:break-word] absolute font-['Inter:Regular',sans-serif] font-normal leading-[19.5px] left-[162px] not-italic text-[13px] text-[var(--grey-muted)] text-center top-[2px] whitespace-nowrap">{`Don't have an account? `}</p>
      <Button3 />
    </div>
  );
}

function ContainerMargin3() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container (margin)">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[20px] relative size-full">
        <Container12 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="max-w-[384px] relative shrink-0 w-[384px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start max-w-[inherit] relative size-full">
        <Container7 />
        <Container9 />
        <ContainerMargin2 />
        <ButtonMargin />
        <ContainerMargin3 />
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute content-stretch flex flex-col h-[944px] items-center justify-center left-[774.5px] px-[48px] top-0 w-[774.5px]" data-name="Container">
      <Container6 />
    </div>
  );
}

export default function LoginScreen() {
  return (
    <div className="bg-[#0a0608] relative size-full" data-name="LoginScreen">
      <DarkBackground />
      <Container />
      <Container5 />
    </div>
  );
}