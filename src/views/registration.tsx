import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import Link from "next/link";
import { registrationSchema, validationOpt } from "schema";
import { useForm, Controller } from "react-hook-form";
// import { useLazerpay } from 'lazerpay-react'
import Input from "@components/commons/Input";
import Button from "@components/commons/Button";
import PhoneInput from "@components/commons/PhoneInput";
import ReactSelect from "@components/commons/ReactSelect";
import TextArea from "@components/commons/TextArea";
import { Gender, PaymentMethod, Tracks } from "enums";
import { userRegistering } from "./api";
import { usePaystackPayment } from "react-paystack";
import { webPayment } from "@server/config";
import formatToCurrency from "utils/formatToCurrency";
import Select from "@components/commons/Select";
import countries from "data/countries.json";
import useCities from "./hooks/useCities";
import { PaymentStatus } from "enums";

const countriesData = countries.map((country) => ({
  value: country.name,
  label: country.name,
}));

const onClose = () => {
  // implementation for  whatever you want to do when the Paystack dialog closed.
  console.log("closed");
};

const Web3View = () => {
  const lazerPayConfig = {
    publicKey: process.env.NEXT_PUBLIC_LAZERPAY_PUBLIC_KEY as string,
    currency: "USD", // USD
    amount: webPayment.USD, // amount as a number
    reference: uuidv4(), // unique identifier
    metadata: {
      track: Tracks.web3,
    },
    onSuccess: (response) => {
      // handle response here
      router.push("/");
    },
    onClose: () => {
      //handle response here
    },
    onError: (response) => {
      // handle responsne here
    },
  };

  const config = {
    reference: uuidv4(),
    amount: webPayment.naira * 100,
    publicKey: process.env.NEXT_PUBLIC_PAYMENT_PUBLIC_KEY as string,
  };
  const router = useRouter();
  const validationOption = validationOpt(registrationSchema.web3);

  const [phone, setPhone] = useState("");
  const [error, setError] = useState<any>("");
  const [message, setMessage] = useState("");
  const handlePhoneChange = (phone) => {
    setPhone(phone);
  };

  const [responsePaymentStatus, setResponsePaymentStatus] = useState(
    PaymentStatus.notInitialized
  );

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty, isValid },
    // @ts-ignore
  } = useForm<any>(validationOption);

  const userEmail = {
    email: watch("email"),
    name: watch("name"),
    country: watch("country"),
    city: watch("city"),
  };

  const city = getValues("country")?.value;

  useEffect(() => {
    setValue("city", "");
  }, [city]);

  const {
    cities,
    loading: cityLoadig,
    error: cityError,
    getCities,
  } = useCities(city);

  const onSuccessPayStack = ({ reference = "" }): void => {
    router.push(
      `/verify-payment?reference=${reference}&email=${userEmail.email}&paymentMethod=card&currentTrack=web3`
    );
  };

  const initializePaymentPayStack = usePaystackPayment({
    ...config,
    ...userEmail,
  });

  //  const initializePaymentLazerPay = useLazerpay({...lazerPayConfig, ...{
  //   customerName: userEmail.name,
  //   customerEmail: userEmail.email,
  //   onSuccess:()=>router.push('/')
  // }});

  const onSubmit = async (value) => {
    // if(!value.paymentMethod){
    //   alert("Please select a payment method")
    // }

    const data = {
      ...value,
      email: value?.email?.toLowerCase(),
      currentTrack: Tracks.web3,
      country: value?.country?.value,
      city: value?.city?.value,
    };

    try {
      // return alert("Registration closed !")

      const response = await userRegistering({
        ...data,
        paymentMethod: "voucher",
      });
      setMessage(response.data.message);

      // if(response.status === 201 && PaymentMethod.card=== data.paymentMethod){

      //  // @ts-ignore
      //   initializePaymentPayStack(onSuccessPayStack, onClose)
      // }

      // if(response.status === 201 && data.paymentMethod === PaymentMethod.crypto){
      //   initializePaymentLazerPay()
      // }

      // setMessage("Registration successful")
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.response?.data?.errors);
      setResponsePaymentStatus(e?.response?.data?.paymentStatus);
    } finally {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const retryPayment = (payment) => {
    if (payment === PaymentMethod.card) {
      // @ts-ignore
      initializePaymentPayStack(onSuccessPayStack, onClose);
    }

    // if(payment === PaymentMethod.crypto){
    //   initializePaymentLazerPay()
    // }
  };

  return (
    <>
      <div className="max-w-lg m-12 mx-auto">
        <div></div>
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="text-2xl dark:text-white20">
            Cohort VIII Registration
          </div>

          {!!error && (
            <>
              <div className="my-2 text-sm font-semibold text-red-500">
                {typeof error === "string" ? (
                  error
                ) : error?.length ? (
                  <>
                    {error.map((err: string) => (
                      <p key={err}>{err}</p>
                    ))}
                  </>
                ) : (
                  responsePaymentStatus === PaymentStatus.pending &&
                  "Payment pending, please try again"
                )}
              </div>

              {/* <>
                   {responsePaymentStatus ===PaymentStatus.success ? 
            <>
                <Link href="/">
              <a className="p-2 mt-4 text-sm font-semibold text-white bg-red-500 rounded-md">Go Back Home</a>
            </Link>
             </>:
               <div>
               <Button onClick={()=>retryPayment(PaymentMethod.card)} className="p-2 mx-2 mt-4 text-sm font-semibold text-white bg-red-500 rounded-md">Card</Button>
                 
               <Button onClick={()=>retryPayment(PaymentMethod.crypto)} className="p-2 mx-2 mt-4 text-sm font-semibold text-white bg-red-500 rounded-md">Crypto</Button>             
             </div>
                     
                       }
                 </> */}
            </>
          )}
          {!!message && (
            <div className="my-2 text-lg text-center dark:text-white ">
              {message}
              <div className="mt-4">
                <Link href="/">
                  <a className="p-2 mt-4 text-sm font-semibold text-white bg-red-500 rounded-md">
                    Go Back Home
                  </a>
                </Link>
              </div>
            </div>
          )}
        </div>
        {!message && (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <fieldset className="p-4 mx-2 mb-4 border rounded-md">
                <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20">
                  Personal Information
                </legend>

                <div>
                  <Input
                    register={register}
                    disabled={isSubmitting}
                    currentValue={getValues("name")}
                    placeholder="Jane Doe"
                    name="name"
                    required
                    label="Name"
                    errors={errors}
                  />
                </div>
                <div>
                  <Input
                    currentValue={getValues("email")}
                    register={register}
                    disabled={isSubmitting}
                    placeholder="janedoe@mail.com"
                    name="email"
                    required
                    label="Email"
                    errors={errors}
                  />
                </div>
                <div className="relative mb-3">
                  <Select
                    name="gender"
                    register={register}
                    disabled={isSubmitting}
                    errors={errors}
                    label="Gender"
                    currentValue={getValues("gender")}
                    options={[
                      { label: "male", value: "male" },
                      { label: "female", value: "female" },
                    ]}
                  />
                </div>

                <div>
                  <Controller
                    control={control}
                    rules={{
                      required: true,
                    }}
                    name="phone"
                    render={({ field }) => {
                      return (
                        <PhoneInput // @ts-ignore
                          value={phone}
                          disabled={isSubmitting}
                          handleChange={handlePhoneChange}
                          field={field}
                          name="phone"
                          errors={errors}
                          currentValue={getValues("phone")}
                        />
                      );
                    }}
                  />
                </div>

                <div className="relative mb-4">
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <ReactSelect
                        field={field}
                        name="country"
                        label="Country"
                        disabled={isSubmitting}
                        options={countriesData}
                        value={getValues("country")?.value}
                        placeholder="Select Country"
                      />
                    )}
                  />
                </div>

                <div className="relative mb-4">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <ReactSelect
                        field={field}
                        name="city"
                        label="City"
                        options={cities}
                        refetchOptions={() => getCities(city)}
                        optionsError={cityError}
                        placeholder={
                          cities.length > 0
                            ? "Select City"
                            : "Select Country First"
                        }
                        isLoading={cityLoadig}
                        value={getValues("city")?.value}
                        disabled={
                          (!!getValues("country")?.value ? false : true) ||
                          isSubmitting
                        }
                      />
                    )}
                  />
                </div>

                <div className="mb-4">
                  <div className="mb-4">
                    {/* <ImageUpload label="Upload a profile Picture" 
        name="profilePicture"  
        setValues={setValue}
        errors={errors}
        validateName="profilePicVal"       
    /> */}
                  </div>
                </div>
              </fieldset>

              <>
                <fieldset className="p-4 mx-2 mb-4 border rounded-md">
                  <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20">
                    Technical Information
                  </legend>

                  <div>
                    <Input
                      currentValue={getValues("githubUsername")}
                      register={register}
                      disabled={isSubmitting}
                      placeholder="Bloceducare"
                      name="githubUsername"
                      required
                      label="Github Username"
                      errors={errors}
                    />
                  </div>

                  <div>
                    <Input
                      currentValue={getValues("linkedInProfile")}
                      register={register}
                      disabled={isSubmitting}
                      placeholder="https://www.linkedin.com/in/your-profile/"
                      name="linkedInProfile"
                      required
                      label="LinkedIn Profile"
                      errors={errors}
                    />
                  </div>
                </fieldset>

                <fieldset className="p-4 mx-2 mb-4 border rounded-md">
                  <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20">
                    Other Information
                  </legend>
                  <div>
                    <Input
                      currentValue={getValues("walletAddress")}
                      register={register}
                      //  labelClassName="mb-6 border-red-500"
                      disabled={isSubmitting}
                      placeholder="0x0000000000000000000000000000000000000000"
                      name="walletAddress"
                      required
                      label="Ethereum Wallet Address"
                      errors={errors}
                    >
                      <div className="-mt-4 text-sm font-primary dark:text-white20 ">
                        Don't have an ethereum wallet address?
                        <a
                          href="https://drive.google.com/file/d/11RLyQcbFUV2A7KViksOAihhRi1Iz9EVB/view"
                          target="_blank"
                          className="ml-1 text-blue-500 underline capitalize"
                        >
                          learn more
                        </a>
                      </div>
                    </Input>
                  </div>
                  <div>
                    <Input
                      type="number"
                      labelClassName="mt-4 block"
                      currentValue={getValues("yearsOfExperience")}
                      register={register}
                      disabled={isSubmitting}
                      className="mt-4"
                      placeholder="Experience in months"
                      name="yearsOfExperience"
                      required
                      label="Years of Experience in months"
                      errors={errors}
                    />
                  </div>
                </fieldset>

                <fieldset className="p-4 mx-2 mb-4 border rounded-md">
                  <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20 ">
                    Next of Kin Information
                  </legend>

                  <div>
                    <Input
                      register={register}
                      disabled={isSubmitting}
                      currentValue={getValues("nextOfKin")}
                      placeholder="John Doe"
                      name="nextOfKin"
                      required
                      label="Name"
                      errors={errors}
                    />
                  </div>

                  <div>
                    <Controller
                      control={control}
                      rules={{
                        required: true,
                      }}
                      name="nextOfKinPhone"
                      render={({ field }) => {
                        return (
                          <PhoneInput // @ts-ignore
                            value={phone}
                            disabled={isSubmitting}
                            handleChange={handlePhoneChange}
                            field={field}
                            name="nextOfKinPhone"
                            errors={errors}
                            currentValue={getValues("nextOfKinPhone")}
                          />
                        );
                      }}
                    />

                    <div>
                      <Input
                        list="nextOfKinRelation"
                        register={register}
                        disabled={isSubmitting}
                        placeholder="Enter Your Answer"
                        currentValue={getValues("nextOfKinRelationship")}
                        name="nextOfKinRelationship"
                        required
                        label="Relationship"
                        errors={errors}
                      />
                      <datalist id="nextOfKinRelation">
                        <option value="Father"></option>
                        <option value="Mother"></option>
                        <option value="Brother"></option>
                        <option value="Sister"></option>
                        <option value="Uncle"></option>
                        <option value="Aunt"></option>
                        <option value="Cousin"></option>
                        <option value="Other"></option>
                      </datalist>
                      <div>
                        <TextArea
                          name="nextOfKinAddress"
                          errors={errors}
                          register={register}
                          disabled={isSubmitting}
                          required
                          label="Address"
                          placeholder="1 Lagos street, Ikorodu Lagos"
                          currentValue={getValues("nextOfKinAddress")}
                        />
                      </div>
                    </div>
                  </div>
                </fieldset>
              </>

              {/* <fieldset className="p-4 mx-2 mb-4 border rounded-md">
  <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20">Payment</legend>
  <div className="relative mb-3">
 
<label className="block mb-2 dark:text-white20">Payment Method { " "} 
({`₦${formatToCurrency(webPayment.naira)}/$${formatToCurrency(webPayment.USD)}`})
<span className="ml-1 text-red-500">*</span>
 </label>
{
 (errors?.paymentMethod?.type === "required" || !!errors?.paymentMethod?.message) && (
  <span className="absolute right-0 text-sm text-red-500 capitalize label-text-alt">
    <>{errors?.paymentMethod?.message}</>
  </span>
 )
}
<div className="grid grid-cols-2 mb-2 ">
<div className="">
                <input
                  {...register("paymentMethod")}
                  id="paymentMethod-card"
                  type="radio"
                  disabled={isSubmitting}
                  className="form-radio"
                  name="paymentMethod"
                  value='card'               
                />
                <label
                  htmlFor="paymentMethod-card"
                  className="inline-flex items-center dark:text-white10 "
                >
                  <span className="">Card</span>
                </label>
              </div> 
<div className="">
                <input
                  {...register("paymentMethod")}
                  id="paymentMethod-crypto"
                  type="radio"
                  disabled={isSubmitting}
                  className="form-radio"
                  name="paymentMethod"
                  value="crypto"            
                />
                <label
                  htmlFor="paymentMethod-crypto"
                  className="inline-flex items-center dark:text-white10 "
                >
                  <span className="">Crypto</span>
                </label>
              </div>
              </div>

</div>
 </fieldset> */}

              <fieldset className="p-4 mx-2 mb-4 border rounded-md">
                <legend className="block px-1 mb-4 text-sm font-semibold text-gray-700 uppercase dark:text-white20">
                  Apply Voucher
                </legend>
                <div className="relative mb-3">
                  <Input
                    lowerCase={false}
                    register={register}
                    disabled={isSubmitting}
                    currentValue={getValues("voucher")}
                    placeholder="Enter a valid voucher"
                    name="voucher"
                    label="Voucher"
                    errors={errors}
                  />
                </div>
              </fieldset>

              <div className="px-6">
                <Button
                  // disabled
                  disabled={!isValid || !isDirty || isSubmitting}
                  className="w-full py-3 "
                  type="submit"
                >
                  {isSubmitting ? "Loading..." : "Submit"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
};

export default Web3View;
