
import ModifyUserInformation from "./ModifyUserInformation";
import PhotosSide from "./PhotosSide";

export default function Settings() {
    return (
      <div
        className="
          fixed
          flex-col
          bg-[rgba(15,26,36,0.5)]
          mt-30
          md:ml-30 ml-[-5rem]   /* push left off-screen on mobile */
          rounded-tl-4xl shadow-[inset_2px_0_0_0_#27445E,inset_0_2px_0_0_#27445E]
          inset-0
          flex
        "
      >
        <PhotosSide />
        {/* <EditAccountData /> */}
        <ModifyUserInformation />
        <p className="absolute top-1/2 left-1/2"></p>
      </div>
    );
  }
  