import Image from "next/image";
import Link from "next/link";
import { blurUrl } from "data";
import { COHORT_REGISTRATION_OPENED } from "config/constant";


const Card = ({
  imgUrl = "",
  type = "web2",
  text = "Kickstart your career in software development",
  link=""
}) => {
  return (
    <div className="max-w-sm mx-6 my-3 border rounded-md">
      <Link href={link}>
        <a>
          <Image
            src={imgUrl}
            alt="Profile"
            width={400}
            height={400}
            blurDataURL={blurUrl}
          />
          <button className="w-full py-3 capitalize border rounded-b-sm bg-secondary text-secondary font-base border-x-0 dark:text-primary dark:bg-white dark:border-white">
            <p className="font-semibold text-center">{type} Registration</p>
          </button>
        </a>
      </Link>
      <p className="p-2 text-center dark:text-white20">{text}</p>
    </div>
  );
};
const CohortRegistration = () => {
  return (
    <>
      <div className="p-12">
        <div className="flex flex-wrap justify-center p-3 ">
          {COHORT_REGISTRATION_OPENED  ? <>
            {/* <Card
            imgUrl="/web-2.svg"
            type="web2"
            link="/trainings/web2"
            text="Kickstart your career in software development"
          /> */}
          {/* <Card
            imgUrl="/web-3.svg"
            type="web3"
            link="/trainings/web3"
            text="Transition from web2 to web3"
          />  */}

<Card
            imgUrl="/programming.svg"
            type="Specialized Class"
            link="/trainings/special-class"
            text="Kickstart your career in software development"
          />
          </> : <h1 className="my-48 font-bold text-center dark:text-white20">Registration has closed!!</h1>
         }
     
        </div>
      </div>
    </>
  );
};

export default CohortRegistration;