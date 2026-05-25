//! cdp-relay — a tiny TCP forwarder.
//!
//! Listens on 0.0.0.0:<listen> and forwards every connection to 127.0.0.1:<target>.
//! dev-workflow runs this on the Windows side so WSL (NAT networking) can reach a Windows
//! browser's CDP remote-debugging port, which Chromium binds to loopback only. std-only:
//! no crates, no runtime — a single static .exe built with the user's Windows `cargo`.

use std::env;
use std::io;
use std::net::{Shutdown, TcpListener, TcpStream};
use std::thread;

fn pump(mut from: TcpStream, mut to: TcpStream) {
    let _ = io::copy(&mut from, &mut to);
    // Signal EOF to the peer so the other direction can finish cleanly.
    let _ = to.shutdown(Shutdown::Write);
}

fn handle(client: TcpStream, target_port: u16) -> io::Result<()> {
    client.set_nodelay(true).ok();
    let upstream = TcpStream::connect(("127.0.0.1", target_port))?;
    upstream.set_nodelay(true).ok();

    let client_rx = client.try_clone()?;
    let upstream_rx = upstream.try_clone()?;
    // client -> upstream
    thread::spawn(move || pump(client, upstream));
    // upstream -> client
    thread::spawn(move || pump(upstream_rx, client_rx));
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("usage: cdp-relay <listen_port> <target_port>");
        std::process::exit(2);
    }
    let listen_port: u16 = args[1].parse().expect("invalid listen port");
    let target_port: u16 = args[2].parse().expect("invalid target port");

    let listener = TcpListener::bind(("0.0.0.0", listen_port)).expect("bind failed");
    for stream in listener.incoming() {
        if let Ok(client) = stream {
            // One connection failing must not take down the relay.
            let _ = handle(client, target_port);
        }
    }
}
