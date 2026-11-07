import html from "../assets/Tech/HTML5.png";
import css from "../assets/Tech/CSS3.png";
import javascript from "../assets/Tech/JavaScript.png";
import nodejs from "../assets/Tech/Node.js.png";
import reactjs from "../assets/Tech/React.png";
import nextjs from "../assets/Tech/Next.js.png";
import npm from "../assets/Tech/NPM.png";
import bootstrap from "../assets/Tech/Bootstrap.png";
import bitbucket from "../assets/Tech/BitBucket.png";
import aws from "../assets/Tech/AWS.png";
import docker from "../assets/Tech/Docker.png";
import git from "../assets/Tech/git.png";
import jira from "../assets/Tech/Jira.png";
import mongodb from "../assets/Tech/MongoDB.png";
import redux from "../assets/Tech/Redux.png";
import tailwindcss from "../assets/Tech/Tailwind CSS.png";
import typescript from "../assets/Tech/TypeScript.png";
import expressjs from "../assets/Tech/Express.png";
import linkedIn from "../assets/Tech/linkedIn-user.png";
import gitHub from "../assets/Tech/github-user.png";
import tanstack from "../assets/Tech/TanStack.svg";
import jwt from "../assets/Tech/JWT.svg";
import ejs from "../assets/Tech/EJS.svg";
import mongoose from "../assets/Tech/Mongoose.svg";
import postgresql from "../assets/Tech/PostgreSQL.svg";
import redis from "../assets/Tech/Redis.svg";
import cloudinary from "../assets/Tech/Cloudinary.svg";
import nginx from "../assets/Tech/Nginx.svg";
import linux from "../assets/Tech/Linux.svg";
import githubLogo from "../assets/Tech/GitHub.svg";
import firebase from "../assets/Tech/Firebase.svg";
import razorpay from "../assets/Tech/Razorpay.svg";
import socketio from "../assets/Tech/SocketIO.svg";
import postman from "../assets/Tech/Postman.svg";
import figma from "../assets/Tech/Figma.svg";
import storybook from "../assets/Tech/Storybook.svg";
import gsap from "../assets/Tech/GSAP.svg";
import datocms from "../assets/Tech/DatoCMS.svg";
import dressUpLandImg from "../assets/Projects/dressuplandImg.webp";
import travelFreaksImg from "../assets/Projects/travelFreaks.webp";
import ecommerceImg from "../assets/Projects/ecommerce.webp";
import movieMojoImg from "../assets/Projects/movieMojo.webp";
import favorImg from "../assets/Projects/favor.webp";
import gravityTeamsImg from "../assets/Projects/gravityTeams.webp";
import postPilotImg from "../assets/Projects/postPilot.webp";
import stegoVaultImg from "../assets/Projects/stegoVault.webp";
import p2pStreamImg from "../assets/Projects/p2pStream.webp";
// import liveSiteLink from "../assets/Tech/liveSiteLink.gif";
import githubLink from "../assets/Tech/GitHub.svg";

export interface TechIcon {
  name: string;
  img: string;
}

const techList: TechIcon[] = [
  // Frontend
  { name: "HTML5", img: html },
  { name: "CSS3", img: css },
  { name: "JavaScript", img: javascript },
  { name: "TypeScript", img: typescript },
  { name: "React", img: reactjs },
  { name: "Next.js", img: nextjs },
  { name: "Tailwind CSS", img: tailwindcss },
  { name: "Bootstrap", img: bootstrap },
  { name: "Redux Toolkit", img: redux },
  { name: "TanStack Query", img: tanstack },

  // Backend
  { name: "Node.js", img: nodejs },
  { name: "Express.js", img: expressjs },
  { name: "JWT", img: jwt },
  { name: "EJS", img: ejs },

  // Database
  { name: "MongoDB", img: mongodb },
  { name: "Mongoose", img: mongoose },
  { name: "PostgreSQL", img: postgresql },
  { name: "Redis", img: redis },
  { name: "Cloudinary", img: cloudinary },

  // DevOps & Cloud
  { name: "AWS", img: aws },
  { name: "Nginx", img: nginx },
  { name: "Docker", img: docker },

  // Tools & Platforms
  { name: "Linux", img: linux },
  { name: "Git", img: git },
  { name: "GitHub", img: githubLogo },
  { name: "Bitbucket", img: bitbucket },
  { name: "Jira", img: jira },
  { name: "Firebase", img: firebase },
  { name: "Razorpay", img: razorpay },
  { name: "Socket.IO", img: socketio },
  { name: "Postman", img: postman },
  { name: "Figma", img: figma },
  { name: "Storybook", img: storybook },
  { name: "GSAP", img: gsap },
  { name: "DatoCMS", img: datocms },
  { name: "NPM", img: npm },
];

const socialMediaList = [
  {
    icon: gitHub,
    link: "https://github.com/NithinRajuOfficial",
    label: "GitHub profile",
  },
  {
    icon: linkedIn,
    link: "https://www.linkedin.com/in/nithin-raju-b4a55a237/",
    label: "LinkedIn profile",
  },
];

const contactEmail = "nithinraju909@gmail.com";

const projectData = [
  {
    name: "DressUpLand",
    about:
      "Basic e-commerce website made using Nodejs and Expressjs with server side rendering and database using MongoDb",
    tech: ["Node.js", "Express.js", "MongoDB"],
    img: dressUpLandImg,
    // liveLink: "https://dressupland.store/",
    codeLink: "https://github.com/NithinRajuOfficial/DressUpLand",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "TravelFreaks",
    about:
      "Social media platform for travelers made using ReactJs in frontend and Nodejs, Expressjs in backend and database using MongoDb",
    tech: ["React", "Node.js", "Express.js", "MongoDB"],
    img: travelFreaksImg,
    // liveLink: "https://travelfreaks.nithin.website/",
    codeLink: "https://github.com/NithinRajuOfficial/Travel-Freaks",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "StegoVault",
    about:
      "A browser-based tool that hides encrypted messages inside images using LSB steganography, encryption with pixel-level data embedding — all processed client-side with no server upload.",
    tech: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Web Crypto API (AES-256-GCM + PBKDF2)",
      "Canvas API",
    ],
    img: stegoVaultImg,
    // liveLink: "https://stego-vault.nithin.website/",
    codeLink: "https://github.com/NithinRajuOfficial/Stego_Vault",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "P2P_Stream",
    about:
      "A peer-to-peer streaming platform enabling users to share and view live content seamlessly.",
    tech: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "WebTorrent",
    ],
    img: p2pStreamImg,
    // liveLink: "https://p2p-stream.nithin.website/",
    codeLink: "https://github.com/NithinRajuOfficial/P2P_Stream",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "PostPilot",
    about:
      "PostPilot's marketing site — a responsive landing page showcasing a direct-mail marketing platform for e-commerce brands, complete with light/dark theming and animated content sections.",
    tech: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Swiper"],
    img: postPilotImg,
    // liveLink: "https://postpilot.nithin.website/",
    codeLink: "https://github.com/NithinRajuOfficial/Post_Pilot",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "Favor",
    about:
      "An animated photography studio landing page with a scroll-driven hero, portfolio gallery, and press mentions.",
    tech: ["Next.js 15", "React 19", "TypeScript", "MUI", "GSAP"],
    img: favorImg,
    codeLink: "https://github.com/NithinRajuOfficial/FAVOR_GSAP",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "GravityTeams",
    about:
      "A responsive marketing website for GravityTeam, a crypto market-making firm, showcasing their services, partners, and team across desktop and mobile.",
    tech: ["Next.js 16", "React 19", "TypeScript", "MUI", "Emotion"],
    img: gravityTeamsImg,
    // liveLink: "https://gravity-teams.nithin.website/",
    codeLink: "https://github.com/NithinRajuOfficial/Gravity_Teams",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "OneShop",
    about:
      "Basic e-commerce website made using ReactJs with client side rendering",
    tech: ["React", "JavaScript"],
    img: ecommerceImg,
    // liveLink: "https://one-shop-lac.vercel.app/",
    codeLink: "https://github.com/NithinRajuOfficial/One-Shop",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
  {
    name: "MovieMojo",
    about:
      "Movie updates website made using ReactJs with client side rendering",
    tech: ["React", "JavaScript"],
    img: movieMojoImg,
    // liveLink: "https://movie-mojo-blond.vercel.app/",
    codeLink: "https://github.com/NithinRajuOfficial/MovieMojo",
    // liveSite: liveSiteLink,
    github: githubLink,
  },
];

export { techList, socialMediaList, projectData, contactEmail };
