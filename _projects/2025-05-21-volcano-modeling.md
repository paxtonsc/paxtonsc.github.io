---
title: 'Tungurahua Volcano Modeling & Simulation'
date: 2025-05-21
permalink: /projects/2025/05/geophysics-volcano-research/
show_excerpt: true
draft: true
---

In the fall of 2025, I was living in Seattle, working as a software engineer at SpaceX, and looking for a way to join my girlfriend in Palo Alto. I sent a number of emails to friends, coworkers, and past professors to inquire if they had leads on work that would allow me to work with both physics and software development. 

One of those emails was to Prof. Eric Dunham, and lo and behold he responded:

> I might have funding for a short term programmer position on a project related to explosive volcanic eruption modeling. I'll need to check with my research admin when I'm back in the office next week about the project budget and to figure out exactly how I would be able to hire you.

We worked out the details, and after my last day at SpaceX in December of 2024 I began work with Prof. Dunham in January of 2025. In this writeup, I'll describe some of the projects I worked on while working with Prof. Dunham and his PhD student Mario. 

0. [Context](#context)
1. [Slip weakening for plug](#slip-weakening-for-plug)
2. [Lumped parameter model](#lumped-parameter-model)
3. [Atmosphere coupling](#atmosphere-coupling)

## Context 
Prof. Dunham's PhD student, Mario, was working to accurately model eruptions of [Tungurahua](https://en.wikipedia.org/wiki/Tungurahua), an active Stratovolcano in Ecuedor. Mario was working with a modified version of [Quail](https://web.stanford.edu/group/ihmegroup/cgi-bin/MatthiasIhme/wp-content/papercite-data/pdf/ching2022quail.pdf), an open-source PDE solver that one of Prof. Dunham's previous PhD student's, Fred, had already modified to support modeling flow in a quasi-1D volcano conduit. 

## Slip weakening for plug 

### Background
We were working to model [Vulcanian eruptions](https://en.wikipedia.org/wiki/Vulcanian_eruption). Vulcanian eruptions are typically charecterized by a solid plug forming in the conduit of the volcano, pressure building up beneath that plug, and ultimately a short, violent eruption after which a new plug forms in the conduit. 

The project I was hired for was to implement a slip-weakening friction law for the volcano plug to the 1D conduit model. Prior to my arrival, the workflow for simulating an eruption was: 
1. Solve the steady state ODEs to arrive at the steady state initial conditions for the eruption.
2. Apply those initial conditions to a dynamic model where the plug was effectively removed numerically causing the volcano to erupt. 

My goal was to integrate the plug explusion into the numerical model. 

<img align="left" width="50%" src="/images/2025-05-geophysics/simple_volcano_model.png">

$test$

Specifically, I would add a feature to the quail simulation library to apply different friction laws to the solid plug and the liquid melt. For the plug, we apply a slip friction law that is just the area the plug contacts the conduit $\pi R L$ multiplied by the $\tau(s(t))$, the wall shear stress where $s(t)$ is 'slip' or displacement as a function of time. 
$$\tau(s(t)) = \tau_{res} + (\tau_{peak} - \tau_r) \exp{-\frac{s(t)}{D_c}}$$

Where $\tau_{peak}$ and $\tau_{residual}$ are parameters to select based on observational data from past eruptions. 

Prof. Dunham had previously applied "slip-weakening" [with success](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2006JB004717) to earthquake models, and thought the mechanism was also applicable with the volcano plug. 

### Implemenation

In order to implement a distinct friction laws for the plug and the melt, it is necessary to know the slip value for specific position $x$ at a specific time $t$. Tracking slip as function of position and time allows us to distinguish between the plug and the melt, and also would provide an input for the slip weakening friction law. So the first step, is to add a new conserved variable that tracks slip.  

The [quail code](https://github.com/fredriclam/quail_volcano) modeled the quasi-1D conduit by conserving eight state variables: 
- $y_a \rho$ - partial density air phase
- $y_{wf} \rho$ - partial density exsolved water
- $y_{cond} \rho$ - partial density condensed phase
- $\rho u_z$ - momentum
- $E$ - energy 
- $y_{wt} \rho$ - partial density water, total
- $y_{crys} \rho$ - partial density crystals
- $y_f \rho$ - Fragmented condensed phase

Each of those variables, is conserved according to various conservation equations. For example, the partial melt density is conserved according to the equation:

$$ \frac{\partial}{\partial t} (y_a \rho) + \frac{\partial}{\partial z}(y_a \rho u_z) = 0 $$

The conservation equation for our new variable slip is:

$$\frac{\partial}{\partial t} \rho s + \frac{\partial}{\partial z} s \rho u = \rho u$$

I match the implementation of other conserved state variables to add this new variable in this [PR](https://github.com/fredriclam/quail_volcano/commit/3f26ef12649b0b235c5e7d002606f54a50cae46a). With the new variable added, the next step was to implement the slip friction law. I added two variants; both the exponential law above and also a linear slip weakening model. 

### Validation
#### Comparison of analytical ODE result to numerical PDE result in static case
To show the the slip weakening force is working as expected, let's consider a simplified model where the only forces at play are pressure, gravity, slip-weakening friction, and viscous drag. The resulting ODE for the slip of the plug:

$$
\begin{align}
M \ddot{s} &= A (p_0 ) - p_{atm}A - Mg - 2 \pi R \tau(s) - \frac{8 \mu}{R^2} \dot{s} \\
\end{align}
$$

where $p_0$ is the pressure just below the plug and $\mu$ is viscosity. Solving for the steady state--where acceleration ($\ddot{s}$) and velocity ($\dot{s}$) are zero--we get: 

$$
\begin{align}
0 &= A p_0 - p_{atm}A - M g - 2 \pi R L \tau_{peak} \\
p_0 &= p_{atm} + \rho g L + \frac{2 L \tau_{peak}}{R} 
\end{align}
$$

With the specific values from our test problem we get:

$$
\begin{align}
p_0 &= 1e5 + \frac{2* 50 [m] * 1e6 [Pa]}{10 [m]} + 2.6e3 [kg/m^3] * 50[m] * 9.8[m/s^2] \\
p_0 &= 11.4e6 \\
\end{align}
$$

Further, if we wanted to calculate the expected pressure in steady state at the very bottom of the domain, we could do that with

$$
\begin{align}
p_L &= p_0 + \rho g * L_{melt} \\
P_L &= 11.4e6 + 2.6e3 [kg/m^3] * 950 [m] * 9.8 [m/s^2] \\
P_L &= 36.6 [Pa]
\end{align}
$$

When we run the numerical model, we see that both analytical predicts are spot on! This implies that we have successfully implemented the slip-weakening friction, at least in the zero-slip case. 

<iframe width="100%" height="500px" src="/images/2025-05-geophysics/basic_simulation_with_slip.mp4"></iframe>

#### Stability analysis
In the above example we appear to have a stable equilibrium. One question is: for what value of $D_c$ is the system unstable? That is to say, for what value of $D_c$ is: 

$$ \frac{|\frac{d F_{friction}}{d s}|}{|\frac{d F_{pressure}}{d s}|} < 1$$

When the condition above is met, that means that the force due to friction decreases more rapidly than the force due to drag decreases. As a result, we would expect that once the system starts slipping it will at least slip until $s = D_c$. Assuming linear slip weakening and a compressible fluid that meets the requirement.

$$
K = - L \frac{dP}{dL}
$$

We are able to write out the derivatives

$$
\begin{align}
\frac{d F_P}{ds} &= A * \frac{dP}{ds} = \frac{-A * K}{L_{conduit}}\\
\frac{d F_f}{ds} &= 2 \pi R L_{plug} \frac{\tau_p - \tau_r}{D_c}
\end{align}
$$

The instability condition above is met specifically when

$$
\begin{align}
D_c < \frac{L_{conduit} 2 \pi R L_{plug} (\tau_p - \tau_r)}{A K } \\
D_c < \frac{2 L_{conduit} L_{plug} (\tau_p - \tau_r)}{R K } \\
\end{align}
$$

Plugging in the problems specific to my toy problem I get: 

$$
\begin{align}
D_c &< \frac{950 [m] * 50 [m] * 1e6 [Pa]}{10 [m] * 1e9 [Pa]} \\
D_c &< 4.7 \\
\end{align}
$$

In order to test, this result, I leave the initial conditions the same as the previous problem but I reduce $D_c$ to $3 [m]$. Sure enough that is sufficient to cause a small "eruption"

<iframe width="100%" height="500px" src="/images/2025-05-geophysics/small_controlled_eruption.mp4"></iframe>

Sure enough! We got a small eruption. 

## Lumped parameter model



## Atmosphere coupling



