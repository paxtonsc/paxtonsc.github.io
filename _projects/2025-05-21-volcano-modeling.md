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

0. [Context](#0.0-context)
1. [Slip weakening for plug](#1.0-slip-weakening-for-plug)
2. [Lumped parameter model](#2.0-lumped-parameter-model)
3. [Atmosphere coupling](#3.0-atmosphere-coupling)
4. [Conclusion](#4.0-conclusion)

## 0.0 Context 
Prof. Dunham's PhD student, Mario, was working to accurately model eruptions of [Tungurahua](https://en.wikipedia.org/wiki/Tungurahua), an active Stratovolcano in Ecuedor. Mario was working with a modified version of [Quail](https://web.stanford.edu/group/ihmegroup/cgi-bin/MatthiasIhme/wp-content/papercite-data/pdf/ching2022quail.pdf), an open-source PDE solver that one of Prof. Dunham's previous PhD student's, Fred, had already modified to support modeling flow in a quasi-1D volcano conduit. 

## 1.0 Slip weakening for plug 

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
M \ddot{s} &= A (p_0 + \Delta p(s)) - p_{atm}A - Mg - 2 \pi R \tau(s) - \frac{8 \mu}{R^2} \dot{s} \\
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

## 2.0 Lumped parameter model

For further verification and understanding, we decided it might be helpful to compare the results generated from Quail to the numerical solution of the ODE: 

$$
\begin{align}
M_{eff} \ddot{s} &= A (p_0 + \Delta p(s) - p_{atm}) - 2 \pi R L_p \tau(s) - M_{eff} g - 4 \mu L_m \dot{s} \\
\ddot{s} &= \frac{A}{M_{eff}}(p_0 - p_{atm} - \frac{Ks}{L_m}) - \frac{2 \pi R L_p \tau(s)}{M_{eff}} - g - \frac{4 L_m \mu \dot{s}}{M_{eff}}
\end{align}
$$

To calculate the viscous drag term, we assume the velocity in the melt linearly increases zero velocity at the bottom of the conduit to $u_z$ at the top. See my [weekly notes](https://paxtonsc.github.io/files/geophysics/volcano_project/weekly_notes/2025.03.21.experiments.html) from March where I touch on this. 

![](/images/2025-05-geophysics/lumped_parameter_model.png)
*Lumped parameter model compared to Quail for the "slip" eruption simulated in section 1.*

In addition to verification, we hoped the lumped parameter model would allow us to quickly test out a variety of values of: $\tau_{peak}$, $\tau_{residual}$, $D_c$, $R$, etc. While some of the parameters were bounded by observations--such as the $\tau_{peak} - \tau_r$ and R--a lumped parameter model that we could run quickly would be very helpful to quickly search a large parameter space and compare simulated seismic inversions with validation data from the [2014 eruption](https://www.researchgate.net/publication/262563084_The_Vulcanian_eruption_of_February_1st_2014_at_Tungurahua_volcano_Ecuador). However, as our eruption model grew more complicated with the addition of fragmentation and exsolution, it was sufficiently challenging to develop a simple model that would match the more complex Quail simulation. As a result, we temporarily abandoned the effort in interest of focusing on atmospheric coupling and infrasound data validation.  


## 3.0 Atmosphere coupling
Coupled with the seismic sensors around Tunagurhua are infrasound sensors that record atmospheric pressure. Our goal was to couple atmosphere to our volcano model to create a second source--in addition to seismic data--to validate our model against. I approached the atmospheric modeling problem from three methods, and my goal was to get comparable results from each method or at least understand output differences. 

### 3.1 Quail atmospheric model 

Our first concept was to apply the axissymetric atmosphere model that former PhD student Fred Lam had already implemented into Quail... 

### 3.2 Simple monopole source model

In order to sanity check the output of the Quail atmosphere model, we decided to create a very simple atmosphere model where we assume the source term to be a single monopole at the outlet of the volcano from which pressure could be modeled with the relation:

$$
p(r,t) = \frac{\rho \dot{Q}(t-r/c)}{4 \pi} \\
$$

where $Q(t) = \dot{s} \pi R^2$ is the volumetric flow in units $[\frac{m^3}{s}]$. The derivation for this relation can be found [here](https://drive.google.com/file/d/1khrmHWfoOqrcBjE533TtZirvnp9IIAc3/view). The code for this simple model is in my [weekly notes from April](https://paxtonsc.github.io/files/geophysics/volcano_project/weekly_notes/2025.04.28.experiments.html).  


<iframe width="100%" height="500px" src="/images/2025-05-geophysics/small_controlled_eruption.mp4"></iframe>

*Monopole source model applied to the simple slip eruption in section 1.*

![](/images/2025-05-geophysics/monopole_pressure_vs_time.png)
*Pressure measured at various distances from the outlet for the above simulation.*

### Lighthill Stress Tensor 

One challenge with the quail atmosphere model is that the error term is fairly diffusive. One way of getting around the diffusive error is to use the [Lighthill Analogy](https://doc.comsol.com/6.1/doc/com.comsol.help.aco/aco_ug_pressure.05.151.html) where Lighthill rearranged the Navier-Stokes equation into an inhomogenous wave equation where the source term only exists in regions of turbulent flow.  

$$
\begin{align}
\frac{1}{c_0^2}\frac{\partial^2p}{\partial t^2} - \nabla^2 p = \nabla \cdot (\nabla \cdot T) \\
\end{align}
$$

The freespace Green's theorm satisfies the case

$$
\begin{align}
\frac{1}{c_0^2}\frac{\partial^2 G}{\partial t^2} - \nabla^2 G = 0
\end{align}
$$

where the freespace Green's theorm for three dimensions is given by 

$$
\begin{align}
G(x, t; y, \tau) = \frac{\delta( t - \tau - \frac{|x-y|}{c0})}{4 \pi |x - y|}
\end{align}
$$


**Volume Integral approach**
The simplest approach for calculating pressure with the lighthill analogy is to integrate over the entire volume of turbulent flow and used that volume integral to predict the acoustic pressure of some distance location $x$. 

$$
\begin{align}
p'(x,t) &= \int \int_V  G(x, t; y, \tau) \frac{\partial^2 T_{ij}}{\partial y_i \partial y_j}(y, \tau)dy d\tau \\
p'(x,t) &=\frac{1}{4 \pi} \int_V \frac{1}{|x-y|} \frac{\partial^2 T_{ij}}{\partial y_i \partial y_j}(y, t-\frac{|x-y|}{c_0})dy^3 
\end{align}
$$

**Surface Integral approach**

It is also possible to translate the volume integral as a surface integral. 

$$
\begin{align}
p'(x,t) = \frac{1}{4\pi} \int_v \frac{1}{|x - y|} \frac{\partial}{\partial y_i} \frac{\partial T_{ij}}{\partial y_j} (y, t - \frac{|x-y|}{c_0}) dy^3
\end{align}
$$

Applying the divergence theorm, we are able to rewrite this volume integral as a surface intgral. 


$$
\begin{align}
p'(x,t) = \frac{1}{4\pi} \int_S \frac{1}{|x - y|}  \frac{\partial T_{ij}}{\partial y_j} (y, t - \frac{|x-y|}{c_0}) \cdot \hat{n} dy^2
\end{align}
$$

Let's integrate over the sphere with a radius $a=100m$. Let's review a couple aspects of spherical coordinates. 

$$
\begin{align}
dS =& a^2 \sin \phi d \phi d \theta \\
x =& a \sin \phi \cos \theta \\
y =& a \sin \phi \sin \theta \\
z =& a \cos \phi
\end{align}
$$

So we should be able to rewrite the surface integral as follows: 

$$
p'(x, t) = \frac{1}{4 \pi} \int_0^{\pi/3} \int_0^{2\pi}  \frac{1}{|x - y|} \frac{\partial T_{ij}}{\partial y_j} n_j a^2 \sin \phi d \phi d \theta
$$


## 4.0 Conclusion