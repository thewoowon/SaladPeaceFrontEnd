import { gql, useQuery,useSubscription } from "@apollo/client";
import React,{useEffect} from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams,useNavigate } from "react-router-dom";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";
import { Dish } from "../../components/dish";
import {
  DISH_FRAGMENT,
  ORDERS_FRAGMENT,
  FULL_ORDER_FRAGMENT,
  RESTAURANT_FRAGMENT,
} from "../../fragments";
import { useMe } from "../../hooks/useMe";
import {
  myRestaurant,
  myRestaurantVariables,
} from '../../__generated__/myRestaurant';
import { pendingOrders } from "../../__generated__/pendingOrders";

export const MY_RESTAURANT_QUERY = gql`
  query myRestaurant($input: MyRestaurantInput!) {
    myRestaurant(input: $input) {
      ok
      error
      restaurant {
        ...RestaurantParts
        menu {
          ...DishParts
        }
        orders {
          ...OrderParts
        }
      }
    }
  }
  ${RESTAURANT_FRAGMENT}
  ${DISH_FRAGMENT}
  ${ORDERS_FRAGMENT}
`;

const CREATE_PAYMENT_MUTATION = gql`
  mutation createPayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      ok
      error
    }
  }
`;

const PENDING_ORDERS_SUBSCRIPTION = gql`
  subscription pendingOrders {
    pendingOrders {
      ...FullOrderParts
    }
  }
  ${FULL_ORDER_FRAGMENT}
`;

interface IParams {
  id: string;
}

export const MyRestaurant = () => {
  const {id} = useParams<{id:string}>();
  const { data } = useQuery<myRestaurant, myRestaurantVariables>(
    MY_RESTAURANT_QUERY,
    {
        variables: {
            input:{
                id:+(id ?? "")
            }
        },
    }
  );
  const { data: userData } = useMe();
  // @ts-ignore
  const Paddle = window.Paddle;
  const openCheckout  = () => { 
      Paddle.Setup({ vendor: 155253 });
      Paddle.Checkout.open({
        product: 638793,
        email: userData?.me.email,
        successCallback: (data: any) => {
          // createPaymentMutation({
          //   variables: {
          //     input: {
          //       transactionId: data.checkout.id,
          //       restaurantId: +id,
          //     },
          //   },
          // });
        },
      });
  }
  const { data: subscriptionData } = useSubscription<pendingOrders>(
    PENDING_ORDERS_SUBSCRIPTION
  );
  const navigate = useNavigate();
  useEffect(() => {
    if (subscriptionData?.pendingOrders.id) {
      navigate(`/orders/${subscriptionData.pendingOrders.id}`);
    }
  }, [subscriptionData]);
  return (
    <div>
      <Helmet>
        <title>
          {data?.myRestaurant.restaurant?.name || "Loading..."} | Uber Eats
        </title>
        <script src="https://cdn.paddle.com/paddle/paddle.js"></script>
        <script type="text/javascript">
          
        </script>
      </Helmet>
      <div
        className="  bg-gray-700  py-28 bg-center bg-cover"
        style={{
          backgroundImage: `url(${data?.myRestaurant.restaurant?.coverImg})`,
        }}
      ></div>
      <div className="container mt-10">
        <h2 className="text-4xl font-medium mb-10">
          {data?.myRestaurant.restaurant?.name || "Loading..."}
        </h2>
        <Link
          to={`/restaurants/${id}/add-dish`}
          className=" mr-8 text-white bg-gray-800 py-3 px-10"
        >
          Add Dish &rarr;
        </Link>
        <span className="cursor-pointer text-white bg-lime-700 py-3 px-10"
        onClick={openCheckout}>
          Buy Promotion &rarr;
        </span>
        <div className="mt-10">
          {data?.myRestaurant.restaurant?.menu.length === 0 ? (
            <h4 className="text-xl mb-5">Please upload a dish!</h4>
            ) : (
                <div className="grid mt-16 md:grid-cols-3 gap-x-5 gap-y-10">
                  {data?.myRestaurant.restaurant?.menu.map((dish) => (
                    <Dish
                      key={dish.id}
                      name={dish.name}
                      description={dish.description}
                      price={dish.price}>
                        {

                        }
                      </Dish>
                  ))}
                </div>
              )}
        </div>
        <div className="mt-20 mb-10">
          <h4 className="text-center text-2xl font-medium">Sales</h4>
          <div className="  mt-10">
            <VictoryChart
              height={500}
              theme={VictoryTheme.material}
              width={window.innerWidth}
              domainPadding={50}
              containerComponent={<VictoryVoronoiContainer />}
            >
              <VictoryLine
                labels={({ datum }) => `$${datum.y}`}
                labelComponent={
                  <VictoryTooltip
                    style={{ fontSize: 18 } as any}
                    renderInPortal
                    dy={-20}
                  />
                }
                data={data?.myRestaurant.restaurant?.orders.map((order) => ({
                  x: order.createdAt,
                  y: order.total,
                }))}
                interpolation="natural"
                style={{
                  data: {
                    strokeWidth: 5,
                  },
                }}
              />
              <VictoryAxis
                tickLabelComponent={<VictoryLabel renderInPortal />}
                style={{
                  tickLabels: {
                    fontSize: 20,
                  } as any,
                }}
                tickFormat={(tick) => new Date(tick).toLocaleDateString("ko")}
              />
            </VictoryChart>
          </div>        
        </div>
      </div>
    </div>
  );
};