function Login() {
  return (
    <>
      <div className="w-full h-screen gap-10 bg-zinc-700 flex justify-center items-center flex-col">
        <h1 className="font-bold text-4xl">Please Log in using spotify</h1>
        <a
          href={`${import.meta.env.BACKEND_URL || "http://localhost:5000"}/auth/spotify`}
          className="bg-green-700 p-2 rounded"
        >
          Login with spotify
        </a>
      </div>
    </>
  );
}

export default Login;
