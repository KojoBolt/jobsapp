import EmailPics from "../../assets/images/email.png";


const EmailConfirmation = () => {
  return (
    <div className="bg-white flex justify-center items-center text-black h-screen">
        <div className="text-center">
            <img src={EmailPics} alt="Email confirmation illustration" className="mx-auto mb-4 w-64 h-64" />
          <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
          <p className="text-lg">Please check your email for confirmation instructions.</p>
          <p className="text-black">Back to <a href="/" className="text-blue-500 hover:underline">Homepage</a></p>
        </div>
    </div>
  )
}

export default EmailConfirmation